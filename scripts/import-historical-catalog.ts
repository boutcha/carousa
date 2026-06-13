import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { Pool, type PoolClient } from "pg";

type CsvRow = Record<string, string>;
type Layer = "official" | "import";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const snapshotDate = new Date("2026-06-12T00:00:00.000Z");
const batchName = "historical-catalog-2026-06-12";
const dataDir = path.join(projectDir, "docs", "data");
const files = {
  official: path.join(dataDir, "historical-morocco-versions-2000-2026.csv"),
  import: path.join(dataDir, "common-import-versions-2000-2026.csv"),
};

const bodyStyles = new Set([
  "hatchback",
  "sedan",
  "suv",
  "crossover",
  "wagon",
  "van",
  "pickup",
  "coupe",
  "convertible",
  "other",
]);

const market = {
  official: {
    marketCode: "MA",
    marketOrigin: "morocco_official",
    availabilityScope: "used_ma",
    marketContext: "morocco_used",
  },
  import: {
    marketCode: "EU",
    marketOrigin: "morocco_used_import",
    availabilityScope: "imported_edge_case",
    marketContext: "morocco_imported_seen",
  },
} as const;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to import historical catalog data.");
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
  if (!header) return [];

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

function canonicalBrandName(value: string) {
  const normalized = normalizeText(value);
  const aliases: Record<string, string> = {
    bmw: "BMW",
    byd: "BYD",
    citroen: "Citroën",
    dacia: "Dacia",
    kia: "Kia",
    mercedes: "Mercedes-Benz",
    "mercedes benz": "Mercedes-Benz",
    nissan: "Nissan",
    opel: "Opel",
    peugeot: "Peugeot",
    renault: "Renault",
    seat: "Seat",
    skoda: "ŠKODA",
    toyota: "Toyota",
    volkswagen: "Volkswagen",
  };

  return aliases[normalized] ?? value.trim();
}

function parseInteger(value: string | undefined, fieldName: string) {
  const parsed = Number.parseInt((value ?? "").replace(/[^\d-]/g, ""), 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer for ${fieldName}: ${value}`);
  }
  return parsed;
}

function parseOptionalInteger(value: string | undefined) {
  const cleaned = (value ?? "").replace(/[^\d-]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDecimal(value: string | undefined, fieldName: string) {
  const parsed = Number.parseFloat((value ?? "").replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for ${fieldName}: ${value}`);
  }
  return parsed;
}

function asMoney(value: number) {
  return Math.max(1000, Math.round(value / 500) * 500).toString();
}

function interpolatePrice(row: CsvRow, modelYear: number) {
  const yearStart = parseInteger(row.year_start, "year_start");
  const yearEnd = parseInteger(row.year_end, "year_end");
  const min = parseDecimal(row.price_min_mad, "price_min_mad");
  const max = parseDecimal(row.price_max_mad, "price_max_mad");
  if (yearEnd <= yearStart) return asMoney(max);
  const ratio = (modelYear - yearStart) / (yearEnd - yearStart);
  return asMoney(min + (max - min) * ratio);
}

function estimateMileage(row: CsvRow, modelYear: number) {
  const annualMileage = parseInteger(row.annual_mileage_km, "annual_mileage_km");
  const age = Math.max(1, 2026 - modelYear);
  return Math.min(Math.max(age * annualMileage, 12000), 320000);
}

function bodyStyle(row: CsvRow) {
  const value = row.body_style || "other";
  return bodyStyles.has(value) ? value : "other";
}

async function ensureSource(
  client: PoolClient,
  cache: Map<string, string>,
  input: { name: string; url: string; confidence: number; metadata: Record<string, unknown> },
) {
  const cacheKey = `${input.name}|${input.url}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const existing = await client.query<{ id: string }>(
    "select id from sources where name = $1 and coalesce(url, '') = $2 limit 1",
    [input.name, input.url],
  );
  if (existing.rows[0]) {
    cache.set(cacheKey, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const result = await client.query<{ id: string }>(
    `
      insert into sources (name, type, url, publisher, retrieved_at, as_of_date, confidence, metadata)
      values ($1, 'manual', $2, $1, $3, $4, $5, $6)
      returning id
    `,
    [input.name, input.url, snapshotDate, "2026-06-12", input.confidence, input.metadata],
  );
  cache.set(cacheKey, result.rows[0].id);
  return result.rows[0].id;
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
  input: { brandId: string; modelName: string; bodyStyle: string },
) {
  const slug = toSlug(input.modelName, "model");
  const cacheKey = `${input.brandId}|${slug}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await client.query<{ id: string }>(
    `
      insert into vehicle_models (brand_id, name, slug, body_style)
      values ($1, $2, $3, $4)
      on conflict (brand_id, slug) do update
      set
        name = excluded.name,
        body_style = case
          when vehicle_models.body_style = 'other' then excluded.body_style
          else vehicle_models.body_style
        end,
        updated_at = now()
      returning id
    `,
    [input.brandId, input.modelName.trim(), slug, input.bodyStyle],
  );

  cache.set(cacheKey, result.rows[0].id);
  return result.rows[0].id;
}

async function ensureGeneration(
  client: PoolClient,
  cache: Map<string, string>,
  input: {
    modelId: string;
    name: string;
    code: string;
    startsYear: number;
    endsYear: number | null;
  },
) {
  const cacheKey = `${input.modelId}|${input.code}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await client.query<{ id: string }>(
    `
      insert into vehicle_generations (model_id, name, code, starts_year, ends_year)
      values ($1, $2, $3, $4, $5)
      on conflict (model_id, code) do update
      set
        name = excluded.name,
        starts_year = least(vehicle_generations.starts_year, excluded.starts_year),
        ends_year = greatest(coalesce(vehicle_generations.ends_year, excluded.ends_year), excluded.ends_year),
        updated_at = now()
      returning id
    `,
    [input.modelId, input.name, input.code, input.startsYear, input.endsYear],
  );

  cache.set(cacheKey, result.rows[0].id);
  return result.rows[0].id;
}

async function ensureVersion(
  client: PoolClient,
  cache: Map<string, string>,
  input: {
    generationId: string;
    marketCode: string;
    marketOrigin: string;
    availabilityScope: string;
    commercialName: string;
    trimName: string;
    fiscalHp: number | null;
    bodyStyle: string;
    confidence: number;
    notes: string;
  },
) {
  const slug = toSlug(`${input.commercialName} ${input.trimName}`, "version");
  const cacheKey = `${input.generationId}|${input.marketCode}|${slug}`;
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
        seats,
        body_style,
        source_confidence,
        equivalence_notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, 5, $9, $10, $11)
      on conflict (generation_id, market_code, slug) do update
      set
        commercial_name = excluded.commercial_name,
        trim_name = excluded.trim_name,
        market_origin = excluded.market_origin,
        availability_scope = excluded.availability_scope,
        fiscal_hp = coalesce(vehicle_versions.fiscal_hp, excluded.fiscal_hp),
        seats = coalesce(vehicle_versions.seats, excluded.seats),
        body_style = excluded.body_style,
        source_confidence = greatest(vehicle_versions.source_confidence, excluded.source_confidence),
        equivalence_notes = excluded.equivalence_notes,
        updated_at = now()
      returning id
    `,
    [
      input.generationId,
      input.commercialName,
      input.trimName || "Unspecified",
      slug,
      input.marketCode,
      input.marketOrigin,
      input.availabilityScope,
      input.fiscalHp,
      input.bodyStyle,
      input.confidence,
      input.notes,
    ],
  );

  cache.set(cacheKey, result.rows[0].id);
  return result.rows[0].id;
}

async function ensureVersionYear(
  client: PoolClient,
  input: { vehicleVersionId: string; modelYear: number; sourceId: string },
) {
  await client.query(
    `
      insert into version_years (vehicle_version_id, model_year, is_available_new, source_id)
      values ($1, $2, false, $3)
      on conflict (vehicle_version_id, model_year) do update
      set
        is_available_new = false,
        source_id = coalesce(version_years.source_id, excluded.source_id),
        updated_at = now()
    `,
    [input.vehicleVersionId, input.modelYear, input.sourceId],
  );
}

async function insertUsedPriceObservation(
  client: PoolClient,
  input: {
    vehicleVersionId: string;
    sourceId: string;
    marketContext: string;
    priceMad: string;
    modelYear: number;
    mileageKm: number;
    sourceUrl: string;
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
        mileage_km,
        condition,
        city,
        observed_at,
        source_url,
        notes
      )
      values ($1, $2, 'MA', $3, 'manual_estimate', 'MAD', $4, $4, $5, $6, 'used-baseline', 'Morocco', $7, $8, $9)
    `,
    [
      input.vehicleVersionId,
      input.sourceId,
      input.marketContext,
      input.priceMad,
      input.modelYear,
      input.mileageKm,
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
    sourceId: string;
    sourceName: string;
    sourceRecordId: string;
    brandId: string;
    vehicleModelId: string;
    vehicleVersionId: string;
    row: CsvRow;
    layer: Layer;
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
        source_brand_name,
        source_model_name,
        source_version_name,
        source_trim_name,
        brand_id,
        vehicle_model_id,
        vehicle_version_id,
        source_url,
        category,
        energy,
        fiscal_hp_cv,
        model_year,
        public_price_mad,
        confidence,
        observed_at,
        raw_payload
      )
      values ($1, $2, $3, 'version', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      on conflict (source_name, source_record_id) do update
      set
        batch_id = excluded.batch_id,
        source_id = excluded.source_id,
        source_brand_name = excluded.source_brand_name,
        source_model_name = excluded.source_model_name,
        source_version_name = excluded.source_version_name,
        source_trim_name = excluded.source_trim_name,
        brand_id = excluded.brand_id,
        vehicle_model_id = excluded.vehicle_model_id,
        vehicle_version_id = excluded.vehicle_version_id,
        source_url = excluded.source_url,
        category = excluded.category,
        energy = excluded.energy,
        fiscal_hp_cv = excluded.fiscal_hp_cv,
        model_year = excluded.model_year,
        public_price_mad = excluded.public_price_mad,
        confidence = excluded.confidence,
        observed_at = excluded.observed_at,
        raw_payload = excluded.raw_payload,
        updated_at = now()
    `,
    [
      input.batchId,
      input.sourceId,
      input.sourceName,
      input.sourceRecordId,
      input.row.brand,
      input.row.model,
      input.row.commercial_name,
      input.row.trim_name,
      input.brandId,
      input.vehicleModelId,
      input.vehicleVersionId,
      input.row.source_url,
      input.row.body_style,
      input.row.fuel_type,
      parseOptionalInteger(input.row.fiscal_hp),
      parseInteger(input.row.year_end, "year_end"),
      parseInteger(input.row.price_max_mad, "price_max_mad").toString(),
      parseDecimal(input.row.confidence, "confidence"),
      snapshotDate,
      { ...input.row, layer: input.layer },
    ],
  );
}

async function importLayer(
  client: PoolClient,
  input: {
    layer: Layer;
    rows: CsvRow[];
    batchId: string;
    sourceCache: Map<string, string>;
    brandCache: Map<string, string>;
    modelCache: Map<string, string>;
    generationCache: Map<string, string>;
    versionCache: Map<string, string>;
  },
) {
  const stats = { rows: 0, expandedYears: 0 };
  const layerMarket = market[input.layer];

  for (const row of input.rows) {
    const sourceId = await ensureSource(client, input.sourceCache, {
      name: row.source_name,
      url: row.source_url,
      confidence: parseDecimal(row.confidence, "confidence"),
      metadata: { seedFile: path.basename(files[input.layer]), layer: input.layer },
    });
    const brandId = await ensureBrand(client, input.brandCache, row.brand);
    const modelId = await ensureModel(client, input.modelCache, {
      brandId,
      modelName: row.model,
      bodyStyle: bodyStyle(row),
    });
    const generationId = await ensureGeneration(client, input.generationCache, {
      modelId,
      name: row.generation_name,
      code: row.generation_code,
      startsYear: parseInteger(row.starts_year, "starts_year"),
      endsYear: parseOptionalInteger(row.ends_year),
    });
    const versionId = await ensureVersion(client, input.versionCache, {
      generationId,
      marketCode: layerMarket.marketCode,
      marketOrigin: layerMarket.marketOrigin,
      availabilityScope: layerMarket.availabilityScope,
      commercialName: row.commercial_name,
      trimName: row.trim_name,
      fiscalHp: parseOptionalInteger(row.fiscal_hp),
      bodyStyle: bodyStyle(row),
      confidence: parseDecimal(row.confidence, "confidence"),
      notes: `${input.layer === "import" ? "Common import" : "Morocco official"} historical baseline. ${row.notes}`,
    });
    const sourceRecordId = `${input.layer}:${hash([
      row.brand,
      row.model,
      row.generation_code,
      row.commercial_name,
      row.trim_name,
      row.year_start,
      row.year_end,
    ].join("|"))}`;

    await upsertCatalogRecord(client, {
      batchId: input.batchId,
      sourceId,
      sourceName: input.layer === "import" ? "common-import-baseline" : "historical-morocco-baseline",
      sourceRecordId,
      brandId,
      vehicleModelId: modelId,
      vehicleVersionId: versionId,
      row,
      layer: input.layer,
    });

    const yearStart = parseInteger(row.year_start, "year_start");
    const yearEnd = parseInteger(row.year_end, "year_end");
    for (let modelYear = yearStart; modelYear <= yearEnd; modelYear++) {
      await ensureVersionYear(client, { vehicleVersionId: versionId, modelYear, sourceId });
      await insertUsedPriceObservation(client, {
        vehicleVersionId: versionId,
        sourceId,
        marketContext: layerMarket.marketContext,
        priceMad: interpolatePrice(row, modelYear),
        modelYear,
        mileageKm: estimateMileage(row, modelYear),
        sourceUrl: row.source_url,
        notes: `${input.layer === "import" ? "Common import" : "Historical official"} baseline seed. ${row.notes}`,
      });
      stats.expandedYears++;
    }

    stats.rows++;
  }

  return stats;
}

async function main() {
  const officialRows = parseCsv(files.official);
  const importRows = parseCsv(files.import);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  const sourceCache = new Map<string, string>();
  const brandCache = new Map<string, string>();
  const modelCache = new Map<string, string>();
  const generationCache = new Map<string, string>();
  const versionCache = new Map<string, string>();

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
          rowCounts: { official: officialRows.length, import: importRows.length },
        },
        "Historical Morocco official and common-import baseline catalog back to model year 2000.",
      ],
    );
    const batchId = batch.rows[0].id;

    const officialSourceId = await ensureSource(client, sourceCache, {
      name: "Carsablanca historical baseline",
      url: "curated://historical-morocco-official",
      confidence: 0.45,
      metadata: { layer: "official", seedFile: path.basename(files.official) },
    });
    const importSourceId = await ensureSource(client, sourceCache, {
      name: "Carsablanca common-import baseline",
      url: "curated://common-import",
      confidence: 0.4,
      metadata: { layer: "import", seedFile: path.basename(files.import) },
    });

    await client.query(
      "delete from price_observations where source_id = any($1::uuid[]) and observed_at = $2",
      [[officialSourceId, importSourceId], snapshotDate],
    );

    const official = await importLayer(client, {
      layer: "official",
      rows: officialRows,
      batchId,
      sourceCache,
      brandCache,
      modelCache,
      generationCache,
      versionCache,
    });
    const imported = await importLayer(client, {
      layer: "import",
      rows: importRows,
      batchId,
      sourceCache,
      brandCache,
      modelCache,
      generationCache,
      versionCache,
    });

    await client.query("commit");
    console.log(
      JSON.stringify(
        {
          officialRows: official.rows,
          officialExpandedYears: official.expandedYears,
          importRows: imported.rows,
          importExpandedYears: imported.expandedYears,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
