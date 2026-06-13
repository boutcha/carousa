import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { getCatalogCandidateById } from "./catalog";
import {
  parseCatalogCandidateId,
  type VehicleDetailIssue,
} from "./detail";
import type { CatalogCandidate } from "./score";

export type VehicleDetailSpecs = {
  vehicleVersionId: string;
  generationId: string;
  powertrainId: string | null;
  generationName: string;
  generationCode: string | null;
  startsYear: number;
  endsYear: number | null;
  marketCode: string;
  marketOrigin: string;
  availabilityScope: string;
  doors: number | null;
  seats: number | null;
  sourceConfidence: number;
  equivalenceNotes: string | null;
  powertrainName: string | null;
  engineCode: string | null;
  fuelType: string | null;
  transmission: string | null;
  displacementCc: number | null;
  cylinders: number | null;
  horsepowerHp: number | null;
  torqueNm: number | null;
  consumptionMixedL100km: number | null;
  batteryKwh: number | null;
};

export type VehicleDetailMaintenance = {
  itemName: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  costMinMad: number | null;
  costMedianMad: number | null;
  costMaxMad: number | null;
  sourceName: string | null;
  notes: string | null;
};

export type VehicleDetailFeature = {
  category: string;
  name: string;
  availability: string;
  packageName: string | null;
  sourceName: string | null;
};

export type VehicleDetailData = {
  candidate: CatalogCandidate;
  specs: VehicleDetailSpecs;
  issues: VehicleDetailIssue[];
  maintenance: VehicleDetailMaintenance[];
  features: VehicleDetailFeature[];
};

type QueryResult<Row> = {
  rows: Row[];
};

type SpecsRow = {
  vehicle_version_id: string;
  generation_id: string;
  powertrain_id: string | null;
  generation_name: string;
  generation_code: string | null;
  starts_year: number | string;
  ends_year: number | string | null;
  market_code: string;
  market_origin: string;
  availability_scope: string;
  doors: number | string | null;
  seats: number | string | null;
  source_confidence: number | string;
  equivalence_notes: string | null;
  powertrain_name: string | null;
  engine_code: string | null;
  fuel_type: string | null;
  transmission: string | null;
  displacement_cc: number | string | null;
  cylinders: number | string | null;
  horsepower_hp: number | string | null;
  torque_nm: number | string | null;
  consumption_mixed_l_100km: number | string | null;
  battery_kwh: number | string | null;
};

type IssueRow = {
  title: string;
  severity: VehicleDetailIssue["severity"];
  affected_system: string;
  confidence: number | string;
  source_name: string | null;
  notes: string | null;
};

type MaintenanceRow = {
  item_name: string;
  interval_km: number | string | null;
  interval_months: number | string | null;
  cost_min_mad: number | string | null;
  cost_median_mad: number | string | null;
  cost_max_mad: number | string | null;
  source_name: string | null;
  notes: string | null;
};

type FeatureRow = {
  category: string;
  name: string;
  availability: string;
  package_name: string | null;
  source_name: string | null;
};

function toNumber(value: number | string | null) {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value: number | string | null) {
  const parsed = toNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

export async function getVehicleDetail(candidateId: string): Promise<VehicleDetailData | null> {
  const parsedId = parseCatalogCandidateId(candidateId);
  if (!parsedId) return null;

  const candidate = await getCatalogCandidateById(candidateId);
  if (!candidate) return null;

  const db = getDb();
  const specs = await loadSpecs(db, parsedId.vehicleVersionId);
  if (!specs) return null;

  const [issues, maintenance, features] = await Promise.all([
    loadIssues(db, {
      vehicleVersionId: parsedId.vehicleVersionId,
      generationId: specs.generationId,
      powertrainId: specs.powertrainId,
      modelYear: candidate.modelYear,
    }),
    loadMaintenance(db, {
      vehicleVersionId: parsedId.vehicleVersionId,
      generationId: specs.generationId,
      powertrainId: specs.powertrainId,
    }),
    loadFeatures(db, parsedId.vehicleVersionId, candidate.modelYear),
  ]);

  return { candidate, specs, issues, maintenance, features };
}

async function loadSpecs(db: ReturnType<typeof getDb>, vehicleVersionId: string) {
  const result = (await db.execute(sql<SpecsRow>`
    select
      v.id::text as vehicle_version_id,
      g.id::text as generation_id,
      v.powertrain_id::text as powertrain_id,
      g.name as generation_name,
      g.code as generation_code,
      g.starts_year,
      g.ends_year,
      v.market_code,
      v.market_origin::text as market_origin,
      v.availability_scope::text as availability_scope,
      v.doors,
      v.seats,
      v.source_confidence,
      v.equivalence_notes,
      p.name as powertrain_name,
      p.engine_code,
      p.fuel_type::text as fuel_type,
      p.transmission::text as transmission,
      p.displacement_cc,
      p.cylinders,
      p.horsepower_hp,
      p.torque_nm,
      p.consumption_mixed_l_100km,
      p.battery_kwh
    from vehicle_versions v
    join vehicle_generations g on g.id = v.generation_id
    left join powertrains p on p.id = v.powertrain_id
    where v.id = ${vehicleVersionId}
    limit 1
  `)) as QueryResult<SpecsRow>;

  const row = result.rows[0];
  if (!row) return null;

  return {
    vehicleVersionId: row.vehicle_version_id,
    generationId: row.generation_id,
    powertrainId: row.powertrain_id,
    generationName: row.generation_name,
    generationCode: row.generation_code,
    startsYear: toInteger(row.starts_year) ?? 0,
    endsYear: toInteger(row.ends_year),
    marketCode: row.market_code,
    marketOrigin: row.market_origin,
    availabilityScope: row.availability_scope,
    doors: toInteger(row.doors),
    seats: toInteger(row.seats),
    sourceConfidence: toNumber(row.source_confidence) ?? 0,
    equivalenceNotes: row.equivalence_notes,
    powertrainName: row.powertrain_name,
    engineCode: row.engine_code,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    displacementCc: toInteger(row.displacement_cc),
    cylinders: toInteger(row.cylinders),
    horsepowerHp: toInteger(row.horsepower_hp),
    torqueNm: toInteger(row.torque_nm),
    consumptionMixedL100km: toNumber(row.consumption_mixed_l_100km),
    batteryKwh: toNumber(row.battery_kwh),
  } satisfies VehicleDetailSpecs;
}

async function loadIssues(
  db: ReturnType<typeof getDb>,
  input: {
    vehicleVersionId: string;
    generationId: string;
    powertrainId: string | null;
    modelYear: number | null;
  },
) {
  const result = (await db.execute(sql<IssueRow>`
    select
      ki.title,
      ki.severity::text as severity,
      ki.affected_system::text as affected_system,
      ki.confidence,
      s.name as source_name,
      ia.notes
    from issue_applicability ia
    join known_issues ki on ki.id = ia.known_issue_id
    left join sources s on s.id = ia.source_id
    where
      ia.vehicle_version_id = ${input.vehicleVersionId}
      or ia.powertrain_id = ${input.powertrainId}
      or (
        ia.generation_id = ${input.generationId}
        and (
          ${input.modelYear}::integer is null
          or ${input.modelYear}::integer between
            coalesce(ia.model_year_start, ${input.modelYear}::integer)
            and coalesce(ia.model_year_end, ${input.modelYear}::integer)
        )
      )
    order by
      case ki.severity
        when 'critical' then 0
        when 'high' then 1
        when 'medium' then 2
        else 3
      end,
      ki.confidence desc,
      ki.title asc
    limit 80
  `)) as QueryResult<IssueRow>;

  const seen = new Set<string>();
  const issues: VehicleDetailIssue[] = [];

  for (const row of result.rows) {
    const key = `${row.title}|${row.severity}|${row.affected_system}`;
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push({
      title: row.title,
      severity: row.severity,
      affectedSystem: row.affected_system,
      confidence: toNumber(row.confidence) ?? 0,
      sourceName: row.source_name,
      notes: row.notes,
    });
  }

  return issues;
}

async function loadMaintenance(
  db: ReturnType<typeof getDb>,
  input: {
    vehicleVersionId: string;
    generationId: string;
    powertrainId: string | null;
  },
) {
  const result = (await db.execute(sql<MaintenanceRow>`
    select
      ms.item_name,
      ms.interval_km,
      ms.interval_months,
      ms.cost_min_mad,
      ms.cost_median_mad,
      ms.cost_max_mad,
      s.name as source_name,
      ms.notes
    from maintenance_schedules ms
    left join sources s on s.id = ms.source_id
    where
      ms.vehicle_version_id = ${input.vehicleVersionId}
      or ms.powertrain_id = ${input.powertrainId}
      or ms.generation_id = ${input.generationId}
    order by coalesce(ms.interval_km, 999999), coalesce(ms.interval_months, 999), ms.item_name
    limit 30
  `)) as QueryResult<MaintenanceRow>;

  return result.rows.map((row): VehicleDetailMaintenance => ({
    itemName: row.item_name,
    intervalKm: toInteger(row.interval_km),
    intervalMonths: toInteger(row.interval_months),
    costMinMad: toInteger(row.cost_min_mad),
    costMedianMad: toInteger(row.cost_median_mad),
    costMaxMad: toInteger(row.cost_max_mad),
    sourceName: row.source_name,
    notes: row.notes,
  }));
}

async function loadFeatures(
  db: ReturnType<typeof getDb>,
  vehicleVersionId: string,
  modelYear: number | null,
) {
  const result = (await db.execute(sql<FeatureRow>`
    select
      f.category,
      f.name,
      vf.availability,
      vf.package_name,
      s.name as source_name
    from version_features vf
    join features f on f.id = vf.feature_id
    left join sources s on s.id = vf.source_id
    where vf.vehicle_version_id = ${vehicleVersionId}
      and (${modelYear}::integer is null or vf.model_year is null or vf.model_year = ${modelYear})
    order by f.category, f.name
    limit 80
  `)) as QueryResult<FeatureRow>;

  return result.rows.map((row): VehicleDetailFeature => ({
    category: row.category,
    name: row.name,
    availability: row.availability,
    packageName: row.package_name,
    sourceName: row.source_name,
  }));
}
