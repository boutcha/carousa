import { loadEnvConfig } from "@next/env";
import { Pool, type PoolClient } from "pg";

import {
  createReliabilitySeedPlan,
  type PlannedKnownIssue,
  type PlannedMaintenanceSchedule,
  type ReliabilitySeedVehicle,
} from "../lib/reliability/seed-plan";

type VehicleRow = {
  brand_id: string;
  brand: string;
  model_id: string;
  model: string;
  generation_id: string;
  generation_name: string;
  generation_code: string | null;
  starts_year: number | string;
  ends_year: number | string | null;
  version_id: string;
  powertrain_id: string | null;
  commercial_name: string;
  trim_name: string;
  body_style: ReliabilitySeedVehicle["bodyStyle"];
  market_code: string;
  market_origin: string;
  availability_scope: string;
  fiscal_hp: number | string | null;
  seats: number | string | null;
  source_confidence: number | string;
  fuel_type: string | null;
};

type SeedOptions = {
  dryRun: boolean;
};

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const seedSourceName = "Carsablanca reliability baseline";
const seedSourceUrl = "curated://carsablanca/reliability-baseline/v1";
const seedSlugPrefix = "carsablanca-reliability-baseline-";
const snapshotDate = new Date("2026-06-13T00:00:00.000Z");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed reliability baselines.");
}

function parseArgs(): SeedOptions {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run") || !args.has("--apply");
  return { dryRun };
}

function toInteger(value: number | string | null) {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumber(value: number | string | null) {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toVehicle(row: VehicleRow): ReliabilitySeedVehicle {
  const startsYear = toInteger(row.starts_year);
  if (!startsYear) {
    throw new Error(`Missing starts_year for generation ${row.generation_id}`);
  }

  return {
    brandId: row.brand_id,
    brand: row.brand,
    modelId: row.model_id,
    model: row.model,
    generationId: row.generation_id,
    generationName: row.generation_name,
    generationCode: row.generation_code,
    startsYear,
    endsYear: toInteger(row.ends_year),
    versionId: row.version_id,
    powertrainId: row.powertrain_id,
    commercialName: row.commercial_name,
    trimName: row.trim_name,
    bodyStyle: row.body_style,
    marketCode: row.market_code,
    marketOrigin: row.market_origin,
    availabilityScope: row.availability_scope,
    fiscalHp: toInteger(row.fiscal_hp),
    seats: toInteger(row.seats),
    sourceConfidence: toNumber(row.source_confidence) ?? 0.35,
    fuelType: row.fuel_type,
  };
}

async function loadVehicles(client: PoolClient) {
  const result = await client.query<VehicleRow>(`
    select
      b.id::text as brand_id,
      b.name as brand,
      m.id::text as model_id,
      m.name as model,
      g.id::text as generation_id,
      g.name as generation_name,
      g.code as generation_code,
      g.starts_year,
      g.ends_year,
      v.id::text as version_id,
      v.powertrain_id::text as powertrain_id,
      v.commercial_name,
      v.trim_name,
      v.body_style::text as body_style,
      v.market_code,
      v.market_origin::text as market_origin,
      v.availability_scope::text as availability_scope,
      v.fiscal_hp,
      v.seats,
      v.source_confidence,
      p.fuel_type::text as fuel_type
    from vehicle_versions v
    join vehicle_generations g on g.id = v.generation_id
    join vehicle_models m on m.id = g.model_id
    join brands b on b.id = m.brand_id
    left join powertrains p on p.id = v.powertrain_id
    order by b.name, m.name, g.starts_year, g.name, v.commercial_name, v.trim_name
  `);

  return result.rows.map(toVehicle);
}

async function ensureSource(client: PoolClient) {
  const existing = await client.query<{ id: string }>(
    "select id from sources where name = $1 and coalesce(url, '') = $2 limit 1",
    [seedSourceName, seedSourceUrl],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await client.query<{ id: string }>(
    `
      insert into sources (name, type, url, publisher, retrieved_at, as_of_date, confidence, metadata)
      values ($1, 'manual', $2, $1, $3, $4, $5, $6)
      returning id
    `,
    [
      seedSourceName,
      seedSourceUrl,
      snapshotDate,
      "2026-06-13",
      0.4,
      {
        seedScript: "scripts/seed-reliability.ts",
        caveat: "Deterministic baseline scaffold; not sourced model-specific reliability truth.",
      },
    ],
  );

  return inserted.rows[0].id;
}

async function resetPreviousSeed(client: PoolClient, sourceId: string) {
  await client.query("delete from maintenance_schedules where source_id = $1", [sourceId]);
  await client.query("delete from repair_cost_estimates where source_id = $1", [sourceId]);
  await client.query("delete from issue_applicability where source_id = $1", [sourceId]);
  await client.query("delete from known_issues where slug like $1", [`${seedSlugPrefix}%`]);
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function placeholders(
  rows: unknown[][],
  values: unknown[],
) {
  return rows
    .map((row) => {
      const rowPlaceholders = row.map((value) => {
        values.push(value);
        return `$${values.length}`;
      });
      return `(${rowPlaceholders.join(", ")})`;
    })
    .join(", ");
}

async function upsertIssues(client: PoolClient, issues: PlannedKnownIssue[]) {
  const issueIdBySlug = new Map<string, string>();

  for (const issueChunk of chunk(issues, 500)) {
    const values: unknown[] = [];
    const rows = issueChunk.map((issue) => [
      issue.title,
      issue.slug,
      issue.description,
      issue.severity,
      issue.affectedSystem,
      issue.typicalMileageMinKm,
      issue.typicalMileageMaxKm,
      issue.confidence,
    ]);
    const result = await client.query<{ id: string; slug: string }>(
    `
      insert into known_issues (
        title,
        slug,
        description,
        severity,
        affected_system,
        typical_mileage_min_km,
        typical_mileage_max_km,
        confidence
      )
      values ${placeholders(rows, values)}
      on conflict (slug) do update
      set
        title = excluded.title,
        description = excluded.description,
        severity = excluded.severity,
        affected_system = excluded.affected_system,
        typical_mileage_min_km = excluded.typical_mileage_min_km,
        typical_mileage_max_km = excluded.typical_mileage_max_km,
        confidence = excluded.confidence,
        updated_at = now()
      returning id, slug
    `,
      values,
    );

    for (const row of result.rows) {
      issueIdBySlug.set(row.slug, row.id);
    }
  }

  return issueIdBySlug;
}

async function insertRepairCosts(
  client: PoolClient,
  input: { issueIdBySlug: Map<string, string>; issues: PlannedKnownIssue[]; sourceId: string },
) {
  for (const issueChunk of chunk(input.issues, 500)) {
    const values: unknown[] = [];
    const rows = issueChunk.map((issue) => {
      const issueId = input.issueIdBySlug.get(issue.slug);
      if (!issueId) throw new Error(`Issue id not found for ${issue.slug}`);
      return [
        issueId,
        "MA",
        issue.repair.costMinMad,
        issue.repair.costMedianMad,
        issue.repair.costMaxMad,
        issue.repair.laborHoursMin,
        issue.repair.laborHoursMax,
        input.sourceId,
        snapshotDate,
        issue.repair.notes,
      ];
    });

    await client.query(
      `
        insert into repair_cost_estimates (
          known_issue_id,
          country_code,
          cost_min_mad,
          cost_median_mad,
          cost_max_mad,
          labor_hours_min,
          labor_hours_max,
          source_id,
          observed_at,
          notes
        )
        values ${placeholders(rows, values)}
      `,
      values,
    );
  }
}

async function insertApplicability(
  client: PoolClient,
  input: {
    issueIdBySlug: Map<string, string>;
    sourceId: string;
    items: ReturnType<typeof createReliabilitySeedPlan>["applicability"];
  },
) {
  for (const itemChunk of chunk(input.items, 500)) {
    const values: unknown[] = [];
    const rows = itemChunk.map((item) => {
      const issueId = input.issueIdBySlug.get(item.issueSlug);
      if (!issueId) throw new Error(`Issue id not found for ${item.issueSlug}`);
      return [
        issueId,
        item.generationId,
        item.powertrainId,
        item.vehicleVersionId,
        item.modelYearStart,
        item.modelYearEnd,
        item.marketCode,
        item.notes,
        input.sourceId,
      ];
    });

    await client.query(
      `
        insert into issue_applicability (
          known_issue_id,
          generation_id,
          powertrain_id,
          vehicle_version_id,
          model_year_start,
          model_year_end,
          market_code,
          notes,
          source_id
        )
        values ${placeholders(rows, values)}
      `,
      values,
    );
  }
}

async function insertMaintenanceSchedules(
  client: PoolClient,
  input: { sourceId: string; schedules: PlannedMaintenanceSchedule[] },
) {
  for (const scheduleChunk of chunk(input.schedules, 500)) {
    const values: unknown[] = [];
    const rows = scheduleChunk.map((schedule) => [
      schedule.vehicleVersionId,
      schedule.generationId,
      schedule.powertrainId,
      schedule.intervalKm,
      schedule.intervalMonths,
      schedule.itemName,
      schedule.costMinMad,
      schedule.costMedianMad,
      schedule.costMaxMad,
      input.sourceId,
      schedule.notes,
    ]);

    await client.query(
      `
        insert into maintenance_schedules (
          vehicle_version_id,
          generation_id,
          powertrain_id,
          interval_km,
          interval_months,
          item_name,
          cost_min_mad,
          cost_median_mad,
          cost_max_mad,
          source_id,
          notes
        )
        values ${placeholders(rows, values)}
      `,
      values,
    );
  }
}

async function applyPlan(
  client: PoolClient,
  input: { sourceId: string; plan: ReturnType<typeof createReliabilitySeedPlan> },
) {
  await resetPreviousSeed(client, input.sourceId);

  const issueIdBySlug = await upsertIssues(client, input.plan.issues);
  await insertRepairCosts(client, {
    issueIdBySlug,
    issues: input.plan.issues,
    sourceId: input.sourceId,
  });
  await insertApplicability(client, {
    issueIdBySlug,
    sourceId: input.sourceId,
    items: input.plan.applicability,
  });
  await insertMaintenanceSchedules(client, {
    sourceId: input.sourceId,
    schedules: input.plan.maintenanceSchedules,
  });
}

async function main() {
  const options = parseArgs();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const vehicles = await loadVehicles(client);
    if (vehicles.length === 0) {
      throw new Error("No vehicle_versions found; import catalog data before seeding reliability.");
    }

    const plan = createReliabilitySeedPlan(vehicles);

    if (options.dryRun) {
      console.log(
        JSON.stringify(
          {
            mode: "dry-run",
            source: { name: seedSourceName, url: seedSourceUrl },
            ...plan.summary,
          },
          null,
          2,
        ),
      );
      return;
    }

    await client.query("begin");
    const sourceId = await ensureSource(client);
    await applyPlan(client, { sourceId, plan });
    await client.query("commit");

    console.log(
      JSON.stringify(
        {
          mode: "applied",
          sourceId,
          ...plan.summary,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // Ignore rollback failures when no transaction was opened.
    }
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
