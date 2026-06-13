import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { Pool, type PoolClient } from "pg";

type CsvRow = Record<string, string>;
type CatalogRecordKind = "version" | "model_price" | "source_audit";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const dataDir = path.join(projectDir, "docs", "data");
const snapshotDate = new Date("2026-06-12T00:00:00.000Z");
const batchName = "morocco-catalog-2026-06-12";

const files = {
  moteur: path.join(dataDir, "morocco-new-cars-moteur-2026-06-12.csv"),
  wandaloo: path.join(dataDir, "morocco-new-cars-wandaloo-2026-06-12.csv"),
  siaracash: path.join(dataDir, "morocco-new-cars-siaracash-models-2026-06-12.csv"),
  sourceAudit: path.join(dataDir, "morocco-car-catalog-source-audit-expanded-2026-06-12.json"),
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to import catalog sources.");
}

function parseCsv(filePath: string): CsvRow[] {
  const input = fs.readFileSync(filePath, "utf8");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index++) {
    const char = input[index];

    if (inQuotes) {
      if (char === "\"" && input[index + 1] === "\"") {
        field += "\"";
        index++;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
    } else if (char === ";") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = rows.shift();
  if (!header) {
    return [];
  }

  return rows
    .filter((values) => values.length === header.length)
    .map((values) =>
      Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""])),
    );
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function toSlug(value: string, fallback: string) {
  const slug = normalizeText(value).replace(/\s+/g, "-").replace(/^-|-$/g, "");
  return (slug || fallback).slice(0, 200);
}

function hash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 16);
}

function asErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function canonicalBrandName(value: string) {
  const normalized = normalizeText(value);
  const aliases: Record<string, string> = {
    bmw: "BMW",
    byd: "BYD",
    citroen: "Citroën",
    cupra: "Cupra",
    dacia: "Dacia",
    dfsk: "DFSK",
    ds: "DS",
    exeed: "EXEED",
    gwm: "GWM",
    jac: "JAC",
    kgm: "KGM",
    kia: "Kia",
    "lynk and co": "Lynk & Co",
    "lynk et co": "Lynk & Co",
    mercedes: "Mercedes-Benz",
    "mercedes benz": "Mercedes-Benz",
    mg: "MG",
    mini: "MINI",
    omoda: "OMODA",
    peugeot: "Peugeot",
    rox: "ROX",
    seat: "Seat",
    skoda: "ŠKODA",
    soueast: "SOUEAST",
    xpeng: "XPENG",
    zeekr: "Zeekr",
  };

  return aliases[normalized] ?? value.trim();
}

function stripBrandPrefix(model: string, brand: string) {
  const normalizedBrand = normalizeText(brand);
  const normalizedModel = normalizeText(model);

  if (!normalizedModel.startsWith(`${normalizedBrand} `)) {
    return model.trim();
  }

  const prefixPattern = new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
  return model.replace(prefixPattern, "").trim();
}

function bodyStyleFromCategory(category: string) {
  const normalized = normalizeText(category);

  if (!normalized) return "other";
  if (normalized.includes("suv") || normalized.includes("4x4") || normalized.includes("crossover")) {
    return "suv";
  }
  if (normalized.includes("pick")) return "pickup";
  if (normalized.includes("cabriolet") || normalized.includes("roadster")) return "convertible";
  if (normalized.includes("coupe") || normalized.includes("sportive")) return "coupe";
  if (normalized.includes("break")) return "wagon";
  if (
    normalized.includes("fourgon") ||
    normalized.includes("ludospace") ||
    normalized.includes("utilitaire") ||
    normalized.includes("minibus")
  ) {
    return "van";
  }
  if (
    normalized.includes("citadine") ||
    normalized.includes("compacte") ||
    normalized.includes("micro")
  ) {
    return "hatchback";
  }
  if (
    normalized.includes("berline") ||
    normalized.includes("familiale") ||
    normalized.includes("routiere") ||
    normalized.includes("luxe")
  ) {
    return "sedan";
  }

  return "other";
}

function parseInteger(value: string | undefined) {
  const cleaned = (value ?? "").replace(/[^\d-]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMad(value: string | undefined, options: { ignoreBooleanLike?: boolean } = {}) {
  const cleaned = (value ?? "").replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseInt(cleaned, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  if (options.ignoreBooleanLike && parsed <= 1) return null;
  return parsed.toString();
}

function parseDecimal(value: string | undefined) {
  const cleaned = (value ?? "").replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed.toString() : null;
}

function sourceTypeFromAuditType(type: string | undefined) {
  const normalized = normalizeText(type ?? "");
  if (normalized.includes("official")) return "official";
  if (normalized.includes("dealer")) return "dealer";
  if (normalized.includes("marketplace") || normalized.includes("aggregator")) return "marketplace";
  if (normalized.includes("bank")) return "bank";
  if (normalized.includes("insurer")) return "insurer";
  return "other";
}

async function ensureSource(
  client: PoolClient,
  cache: Map<string, string>,
  input: {
    name: string;
    url?: string;
    type?: string;
    publisher?: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
  },
) {
  const cacheKey = `${input.name}|${input.url ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const existing = await client.query<{ id: string }>(
    "select id from sources where name = $1 and coalesce(url, '') = coalesce($2, '') limit 1",
    [input.name, input.url ?? null],
  );

  if (existing.rows[0]) {
    cache.set(cacheKey, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const inserted = await client.query<{ id: string }>(
    `
      insert into sources (name, type, url, publisher, retrieved_at, as_of_date, confidence, metadata)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning id
    `,
    [
      input.name,
      input.type ?? "other",
      input.url ?? null,
      input.publisher ?? input.name,
      snapshotDate,
      "2026-06-12",
      input.confidence ?? 0.6,
      input.metadata ?? {},
    ],
  );

  cache.set(cacheKey, inserted.rows[0].id);
  return inserted.rows[0].id;
}

async function ensureBrand(client: PoolClient, cache: Map<string, string>, name: string) {
  const canonicalName = canonicalBrandName(name);
  const slug = toSlug(canonicalName, "brand");
  const cached = cache.get(slug);
  if (cached) return cached;

  const result = await client.query<{ id: string }>(
    `
      insert into brands (name, slug)
      values ($1, $2)
      on conflict (slug) do update
      set name = excluded.name, updated_at = now()
      returning id
    `,
    [canonicalName, slug],
  );

  cache.set(slug, result.rows[0].id);
  return result.rows[0].id;
}

async function ensureModel(
  client: PoolClient,
  cache: Map<string, string>,
  input: {
    brandId: string;
    brandName: string;
    modelName: string;
    bodyStyle: string;
    segment?: string;
  },
) {
  const modelName = stripBrandPrefix(input.modelName, input.brandName);
  const slug = toSlug(modelName, "model");
  const cacheKey = `${input.brandId}|${slug}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await client.query<{ id: string }>(
    `
      insert into vehicle_models (brand_id, name, slug, segment, body_style)
      values ($1, $2, $3, $4, $5)
      on conflict (brand_id, slug) do update
      set
        name = excluded.name,
        segment = coalesce(vehicle_models.segment, excluded.segment),
        body_style = case
          when vehicle_models.body_style = 'other' then excluded.body_style
          else vehicle_models.body_style
        end,
        updated_at = now()
      returning id
    `,
    [input.brandId, modelName, slug, input.segment ?? null, input.bodyStyle],
  );

  cache.set(cacheKey, result.rows[0].id);
  return result.rows[0].id;
}

async function ensureGeneration(
  client: PoolClient,
  cache: Map<string, string>,
  input: { modelId: string; startsYear: number },
) {
  const cacheKey = `${input.modelId}|ma-current`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await client.query<{ id: string }>(
    `
      insert into vehicle_generations (model_id, name, code, starts_year)
      values ($1, $2, $3, $4)
      on conflict (model_id, code) do update
      set starts_year = least(vehicle_generations.starts_year, excluded.starts_year),
          updated_at = now()
      returning id
    `,
    [input.modelId, "Current Morocco catalogue", "ma-current", input.startsYear],
  );

  cache.set(cacheKey, result.rows[0].id);
  return result.rows[0].id;
}

async function ensureVersion(
  client: PoolClient,
  cache: Map<string, string>,
  input: {
    generationId: string;
    versionName: string;
    trimName: string;
    slugHint: string;
    fiscalHp: number | null;
    bodyStyle: string;
    confidence: number;
  },
) {
  const slug = toSlug(input.slugHint, "version");
  const cacheKey = `${input.generationId}|MA|${slug}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await client.query<{ id: string }>(
    `
      insert into vehicle_versions (
        generation_id,
        commercial_name,
        trim_name,
        slug,
        market_code,
        market_origin,
        availability_scope,
        fiscal_hp,
        body_style,
        source_confidence
      )
      values ($1, $2, $3, $4, 'MA', 'morocco_official', 'new_ma', $5, $6, $7)
      on conflict (generation_id, market_code, slug) do update
      set
        commercial_name = excluded.commercial_name,
        trim_name = excluded.trim_name,
        fiscal_hp = coalesce(vehicle_versions.fiscal_hp, excluded.fiscal_hp),
        body_style = case
          when vehicle_versions.body_style = 'other' then excluded.body_style
          else vehicle_versions.body_style
        end,
        source_confidence = greatest(vehicle_versions.source_confidence, excluded.source_confidence),
        updated_at = now()
      returning id
    `,
    [
      input.generationId,
      input.versionName,
      input.trimName || "Unspecified",
      slug,
      input.fiscalHp,
      input.bodyStyle,
      input.confidence,
    ],
  );

  cache.set(cacheKey, result.rows[0].id);
  return result.rows[0].id;
}

async function ensureVersionYear(
  client: PoolClient,
  input: { vehicleVersionId: string; modelYear: number; officialPriceMad: string | null; sourceId: string },
) {
  await client.query(
    `
      insert into version_years (vehicle_version_id, model_year, official_price_mad, is_available_new, source_id)
      values ($1, $2, $3, true, $4)
      on conflict (vehicle_version_id, model_year) do update
      set
        official_price_mad = coalesce(version_years.official_price_mad, excluded.official_price_mad),
        is_available_new = true,
        source_id = coalesce(version_years.source_id, excluded.source_id),
        updated_at = now()
    `,
    [input.vehicleVersionId, input.modelYear, input.officialPriceMad, input.sourceId],
  );
}

async function insertPriceObservation(
  client: PoolClient,
  input: {
    vehicleVersionId: string;
    sourceId: string;
    priceType: "official" | "dealer_offer";
    priceMad: string;
    modelYear: number;
    sourceUrl: string | null;
    notes: string;
  },
) {
  await client.query(
    `
      insert into price_observations (
        vehicle_version_id,
        source_id,
        country_code,
        market_context,
        price_type,
        currency,
        price,
        price_mad,
        model_year,
        observed_at,
        source_url,
        notes
      )
      values ($1, $2, 'MA', 'morocco_new', $3, 'MAD', $4, $4, $5, $6, $7, $8)
    `,
    [
      input.vehicleVersionId,
      input.sourceId,
      input.priceType,
      input.priceMad,
      input.modelYear,
      snapshotDate,
      input.sourceUrl,
      input.notes,
    ],
  );
}

async function upsertCatalogRecord(
  client: PoolClient,
  input: {
    batchId: string;
    sourceId: string | null;
    sourceName: string;
    sourceKind: CatalogRecordKind;
    sourceRecordId: string;
    sourceBrandId?: string;
    sourceBrandName?: string;
    sourceBrandSlug?: string;
    sourceModelId?: string;
    sourceModelName?: string;
    sourceModelSlug?: string;
    sourceVersionId?: string;
    sourceVersionName?: string;
    sourceVersionSlug?: string;
    sourceTrimName?: string;
    brandId?: string | null;
    vehicleModelId?: string | null;
    vehicleVersionId?: string | null;
    sourceUrl?: string | null;
    modelImageUrl?: string | null;
    category?: string | null;
    energy?: string | null;
    horsepowerCh?: number | null;
    fiscalHpCv?: number | null;
    mixedConsumptionL100km?: string | null;
    modelYear?: number | null;
    publicPriceMad?: string | null;
    promoPriceMad?: string | null;
    turnkeyPriceMad?: string | null;
    confidence: number;
    rawPayload: Record<string, unknown>;
  },
) {
  await client.query(
    `
      insert into catalog_source_records (
        batch_id,
        source_id,
        source_name,
        source_kind,
        source_record_id,
        source_brand_id,
        source_brand_name,
        source_brand_slug,
        source_model_id,
        source_model_name,
        source_model_slug,
        source_version_id,
        source_version_name,
        source_version_slug,
        source_trim_name,
        brand_id,
        vehicle_model_id,
        vehicle_version_id,
        source_url,
        model_image_url,
        category,
        energy,
        horsepower_ch,
        fiscal_hp_cv,
        mixed_consumption_l_100km,
        model_year,
        public_price_mad,
        promo_price_mad,
        turnkey_price_mad,
        confidence,
        observed_at,
        raw_payload
      )
      values (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30,
        $31, $32
      )
      on conflict (source_name, source_record_id) do update
      set
        batch_id = excluded.batch_id,
        source_id = excluded.source_id,
        source_kind = excluded.source_kind,
        source_brand_id = excluded.source_brand_id,
        source_brand_name = excluded.source_brand_name,
        source_brand_slug = excluded.source_brand_slug,
        source_model_id = excluded.source_model_id,
        source_model_name = excluded.source_model_name,
        source_model_slug = excluded.source_model_slug,
        source_version_id = excluded.source_version_id,
        source_version_name = excluded.source_version_name,
        source_version_slug = excluded.source_version_slug,
        source_trim_name = excluded.source_trim_name,
        brand_id = excluded.brand_id,
        vehicle_model_id = excluded.vehicle_model_id,
        vehicle_version_id = excluded.vehicle_version_id,
        source_url = excluded.source_url,
        model_image_url = excluded.model_image_url,
        category = excluded.category,
        energy = excluded.energy,
        horsepower_ch = excluded.horsepower_ch,
        fiscal_hp_cv = excluded.fiscal_hp_cv,
        mixed_consumption_l_100km = excluded.mixed_consumption_l_100km,
        model_year = excluded.model_year,
        public_price_mad = excluded.public_price_mad,
        promo_price_mad = excluded.promo_price_mad,
        turnkey_price_mad = excluded.turnkey_price_mad,
        confidence = excluded.confidence,
        observed_at = excluded.observed_at,
        raw_payload = excluded.raw_payload,
        updated_at = now()
    `,
    [
      input.batchId,
      input.sourceId,
      input.sourceName,
      input.sourceKind,
      input.sourceRecordId,
      input.sourceBrandId ?? null,
      input.sourceBrandName ?? null,
      input.sourceBrandSlug ?? null,
      input.sourceModelId ?? null,
      input.sourceModelName ?? null,
      input.sourceModelSlug ?? null,
      input.sourceVersionId ?? null,
      input.sourceVersionName ?? null,
      input.sourceVersionSlug ?? null,
      input.sourceTrimName ?? null,
      input.brandId ?? null,
      input.vehicleModelId ?? null,
      input.vehicleVersionId ?? null,
      input.sourceUrl ?? null,
      input.modelImageUrl ?? null,
      input.category ?? null,
      input.energy ?? null,
      input.horsepowerCh ?? null,
      input.fiscalHpCv ?? null,
      input.mixedConsumptionL100km ?? null,
      input.modelYear ?? null,
      input.publicPriceMad ?? null,
      input.promoPriceMad ?? null,
      input.turnkeyPriceMad ?? null,
      input.confidence,
      snapshotDate,
      input.rawPayload,
    ],
  );
}

async function main() {
  const moteurRows = parseCsv(files.moteur);
  const wandalooRows = parseCsv(files.wandaloo);
  const siaracashRows = parseCsv(files.siaracash);
  const auditRows = JSON.parse(fs.readFileSync(files.sourceAudit, "utf8")) as Array<
    Record<string, unknown>
  >;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  const sourceCache = new Map<string, string>();
  const brandCache = new Map<string, string>();
  const modelCache = new Map<string, string>();
  const generationCache = new Map<string, string>();
  const versionCache = new Map<string, string>();

  const stats = {
    auditRecords: 0,
    moteurVersions: 0,
    wandalooVersions: 0,
    siaracashModelPrices: 0,
    priceObservations: 0,
  };

  try {
    await client.query("begin");

    const batch = await client.query<{ id: string }>(
      `
        insert into catalog_import_batches (name, source_file_summary, notes)
        values ($1, $2, $3)
        on conflict (name) do update
        set source_file_summary = excluded.source_file_summary,
            notes = excluded.notes,
            imported_at = now(),
            updated_at = now()
        returning id
      `,
      [
        batchName,
        {
          files,
          rowCounts: {
            moteur: moteurRows.length,
            wandaloo: wandalooRows.length,
            siaracash: siaracashRows.length,
            sourceAudit: auditRows.length,
          },
        },
        "Initial consolidated Morocco car catalogue from Moteur.ma, Wandaloo, SiaraCash, and expanded source audit.",
      ],
    );
    const batchId = batch.rows[0].id;

    const moteurSourceId = await ensureSource(client, sourceCache, {
      name: "Moteur.ma",
      url: "https://www.moteur.ma/fr/neuf/voiture/",
      type: "marketplace",
      confidence: 0.75,
      metadata: { role: "version_catalog" },
    });
    const wandalooSourceId = await ensureSource(client, sourceCache, {
      name: "Wandaloo",
      url: "https://www.wandaloo.com/neuf/",
      type: "marketplace",
      confidence: 0.85,
      metadata: { role: "version_price_catalog" },
    });
    const siaracashSourceId = await ensureSource(client, sourceCache, {
      name: "SiaraCash",
      url: "https://siaracash.ma/voiture-neuve",
      type: "marketplace",
      confidence: 0.65,
      metadata: { role: "model_price_catalog" },
    });

    await client.query(
      "delete from price_observations where source_id = any($1::uuid[]) and observed_at = $2",
      [[wandalooSourceId], snapshotDate],
    );

    for (const auditRow of auditRows) {
      const name = String(auditRow.name ?? "");
      const url = String(auditRow.url ?? "");
      const sourceId = await ensureSource(client, sourceCache, {
        name,
        url,
        type: sourceTypeFromAuditType(String(auditRow.type ?? "")),
        confidence: auditRow.ok === true ? 0.55 : 0.35,
        metadata: auditRow,
      });

      await upsertCatalogRecord(client, {
        batchId,
        sourceId,
        sourceName: "source-audit",
        sourceKind: "source_audit",
        sourceRecordId: `audit:${hash(`${name}|${url}`)}`,
        sourceUrl: url || null,
        confidence: auditRow.ok === true ? 0.55 : 0.35,
        rawPayload: auditRow,
      });
      stats.auditRecords++;
    }

    for (const row of moteurRows) {
      const brandName = canonicalBrandName(row.brand);
      const bodyStyle = "other";
      const modelYear = 2026;
      const brandId = await ensureBrand(client, brandCache, brandName);
      const modelId = await ensureModel(client, modelCache, {
        brandId,
        brandName,
        modelName: row.model,
        bodyStyle,
      });
      const generationId = await ensureGeneration(client, generationCache, {
        modelId,
        startsYear: modelYear,
      });
      const versionId = await ensureVersion(client, versionCache, {
        generationId,
        versionName: row.version,
        trimName: "Unspecified",
        slugHint: row.version,
        fiscalHp: null,
        bodyStyle,
        confidence: 0.75,
      });

      await ensureVersionYear(client, {
        vehicleVersionId: versionId,
        modelYear,
        officialPriceMad: null,
        sourceId: moteurSourceId,
      });

      await upsertCatalogRecord(client, {
        batchId,
        sourceId: moteurSourceId,
        sourceName: "moteur.ma",
        sourceKind: "version",
        sourceRecordId: `moteur:${row.version_id}`,
        sourceBrandId: row.brand_id,
        sourceBrandName: row.brand,
        sourceBrandSlug: row.brand_slug,
        sourceModelId: row.model_id,
        sourceModelName: row.model,
        sourceModelSlug: row.model_slug,
        sourceVersionId: row.version_id,
        sourceVersionName: row.version,
        sourceVersionSlug: row.version_slug,
        brandId,
        vehicleModelId: modelId,
        vehicleVersionId: versionId,
        sourceUrl: row.source_url,
        modelImageUrl: row.model_image_url,
        modelYear,
        confidence: 0.75,
        rawPayload: row,
      });
      stats.moteurVersions++;
    }

    for (const row of wandalooRows) {
      const brandName = canonicalBrandName(row.brand);
      const modelYear = parseInteger(row.model_year) ?? 2026;
      const bodyStyle = bodyStyleFromCategory(row.category);
      const publicPriceMad = parseMad(row.public_price_mad);
      const turnkeyPriceMad = parseMad(row.turnkey_price_mad);
      const brandId = await ensureBrand(client, brandCache, brandName);
      const modelId = await ensureModel(client, modelCache, {
        brandId,
        brandName,
        modelName: row.model,
        bodyStyle,
        segment: row.category || undefined,
      });
      const generationId = await ensureGeneration(client, generationCache, {
        modelId,
        startsYear: modelYear,
      });
      const versionId = await ensureVersion(client, versionCache, {
        generationId,
        versionName: row.version,
        trimName: row.trim,
        slugHint: `${row.version} ${row.trim}`,
        fiscalHp: parseInteger(row.fiscal_hp_cv),
        bodyStyle,
        confidence: 0.85,
      });

      await ensureVersionYear(client, {
        vehicleVersionId: versionId,
        modelYear,
        officialPriceMad: publicPriceMad,
        sourceId: wandalooSourceId,
      });

      if (publicPriceMad) {
        await insertPriceObservation(client, {
          vehicleVersionId: versionId,
          sourceId: wandalooSourceId,
          priceType: "official",
          priceMad: publicPriceMad,
          modelYear,
          sourceUrl: row.source_path,
          notes: "Wandaloo public catalogue price.",
        });
        stats.priceObservations++;
      }

      if (turnkeyPriceMad) {
        await insertPriceObservation(client, {
          vehicleVersionId: versionId,
          sourceId: wandalooSourceId,
          priceType: "dealer_offer",
          priceMad: turnkeyPriceMad,
          modelYear,
          sourceUrl: row.source_path,
          notes: "Wandaloo turnkey estimate including listed fees.",
        });
        stats.priceObservations++;
      }

      await upsertCatalogRecord(client, {
        batchId,
        sourceId: wandalooSourceId,
        sourceName: "wandaloo.com",
        sourceKind: "version",
        sourceRecordId: `wandaloo:${row.version_id}`,
        sourceBrandId: row.brand_id,
        sourceBrandName: row.brand,
        sourceModelId: row.model_id,
        sourceModelName: row.model,
        sourceVersionId: row.version_id,
        sourceVersionName: row.version,
        sourceTrimName: row.trim,
        brandId,
        vehicleModelId: modelId,
        vehicleVersionId: versionId,
        sourceUrl: row.source_path,
        category: row.category,
        energy: row.energy,
        horsepowerCh: parseInteger(row.horsepower_ch),
        fiscalHpCv: parseInteger(row.fiscal_hp_cv),
        mixedConsumptionL100km: parseDecimal(row.mixed_consumption_l_100km),
        modelYear,
        publicPriceMad,
        promoPriceMad: parseMad(row.promo_price_mad, { ignoreBooleanLike: true }),
        turnkeyPriceMad,
        confidence: 0.85,
        rawPayload: row,
      });
      stats.wandalooVersions++;
    }

    for (const row of siaracashRows) {
      const brandName = canonicalBrandName(row.brand);
      const modelName = stripBrandPrefix(row.model, brandName);
      const brandId = await ensureBrand(client, brandCache, brandName);
      const modelId = await ensureModel(client, modelCache, {
        brandId,
        brandName,
        modelName,
        bodyStyle: "other",
      });
      await ensureGeneration(client, generationCache, { modelId, startsYear: 2026 });

      await upsertCatalogRecord(client, {
        batchId,
        sourceId: siaracashSourceId,
        sourceName: "siaracash.ma",
        sourceKind: "model_price",
        sourceRecordId: `siaracash:${hash(row.source_url)}`,
        sourceBrandName: row.brand,
        sourceBrandSlug: row.brand_slug,
        sourceModelName: row.model,
        brandId,
        vehicleModelId: modelId,
        sourceUrl: row.source_url,
        modelYear: 2026,
        publicPriceMad: parseMad(row.public_price_mad),
        confidence: 0.65,
        rawPayload: row,
      });
      stats.siaracashModelPrices++;
    }

    await client.query("commit");
    console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    await client.query("rollback");
    throw new Error(`Catalog import failed: ${asErrorMessage(error)}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(asErrorMessage(error));
  process.exit(1);
});
