import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import type { BodyStyle, CatalogCandidate } from "./score";

type CatalogRow = {
  id: string;
  brand: string;
  model: string;
  commercial_name: string;
  trim_name: string;
  body_style: BodyStyle;
  availability_scope: string;
  market_origin: string;
  fiscal_hp: number | null;
  seats: number | null;
  model_year: number | null;
  price_mad: number | string;
  source_names: string[] | string | null;
  official_recall_count: number | string | null;
  high_severity_recall_count: number | string | null;
  critical_recall_count: number | string | null;
};

type QueryResult<Row> = {
  rows: Row[];
};

function toNumber(value: number | string | null) {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function toSourceNames(value: CatalogRow["source_names"]) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return value
    .replace(/^{|}$/g, "")
    .split(",")
    .map((source) => source.replace(/^"|"$/g, "").trim())
    .filter(Boolean);
}

export async function getCatalogCandidates(limit = 6000): Promise<CatalogCandidate[]> {
  const db = getDb();
  const result = (await db.execute(sql<CatalogRow>`
    with nhtsa_recall_summary as (
      select
        ia.generation_id,
        ia.model_year_start,
        ia.model_year_end,
        count(distinct ki.id)::integer as official_recall_count,
        count(distinct ki.id) filter (where ki.severity in ('high', 'critical'))::integer as high_severity_recall_count,
        count(distinct ki.id) filter (where ki.severity = 'critical')::integer as critical_recall_count
      from issue_applicability ia
      join known_issues ki on ki.id = ia.known_issue_id
      where ki.slug like 'nhtsa-recall-%'
        and ia.generation_id is not null
      group by ia.generation_id, ia.model_year_start, ia.model_year_end
    ),
    observed_candidates as (
      select
        concat(v.id::text, ':po:', po.id::text) as id,
        g.id as generation_id,
        b.name as brand,
        m.name as model,
        v.commercial_name,
        v.trim_name,
        v.body_style,
        v.availability_scope,
        v.market_origin,
        v.fiscal_hp,
        v.seats,
        po.model_year::integer as model_year,
        po.price_mad as price_mad,
        array_remove(array[s.name], null) as source_names,
        row_number() over (
          partition by v.id, po.market_context, coalesce(po.model_year, 0), coalesce(po.mileage_km, 0)
          order by po.price_mad asc, po.observed_at desc
        ) as rn
      from price_observations po
      join vehicle_versions v on v.id = po.vehicle_version_id
      join vehicle_generations g on g.id = v.generation_id
      join vehicle_models m on m.id = g.model_id
      join brands b on b.id = m.brand_id
      left join sources s on s.id = po.source_id
      where po.price_mad is not null
        and po.model_year is not null
        and po.market_context in ('morocco_new', 'morocco_used', 'morocco_imported_seen')
    ),
    version_year_candidates as (
      select
        concat(v.id::text, ':vy:', vy.id::text) as id,
        g.id as generation_id,
        b.name as brand,
        m.name as model,
        v.commercial_name,
        v.trim_name,
        v.body_style,
        v.availability_scope,
        v.market_origin,
        v.fiscal_hp,
        v.seats,
        vy.model_year::integer as model_year,
        vy.official_price_mad as price_mad,
        array_remove(array[s.name], null) as source_names,
        1 as rn
      from version_years vy
      join vehicle_versions v on v.id = vy.vehicle_version_id
      join vehicle_generations g on g.id = v.generation_id
      join vehicle_models m on m.id = g.model_id
      join brands b on b.id = m.brand_id
      left join sources s on s.id = vy.source_id
      where vy.official_price_mad is not null
        and vy.is_available_new = true
    ),
    priced_versions as (
      select * from observed_candidates where rn = 1
      union all
      select * from version_year_candidates
    )
    select
      id,
      brand,
      model,
      commercial_name,
      trim_name,
      body_style,
      availability_scope,
      market_origin,
      fiscal_hp,
      seats,
      model_year,
      price_mad,
      source_names,
      coalesce(rs.official_recall_count, 0) as official_recall_count,
      coalesce(rs.high_severity_recall_count, 0) as high_severity_recall_count,
      coalesce(rs.critical_recall_count, 0) as critical_recall_count
    from priced_versions
    left join nhtsa_recall_summary rs
      on rs.generation_id = priced_versions.generation_id
      and priced_versions.model_year between
        coalesce(rs.model_year_start, priced_versions.model_year)
        and coalesce(rs.model_year_end, priced_versions.model_year)
    where price_mad between 15000 and 1200000
    order by
      case availability_scope
        when 'new_ma' then 0
        when 'used_ma' then 1
        else 2
      end,
      price_mad asc,
      brand asc,
      model asc
    limit ${limit}
  `)) as QueryResult<CatalogRow>;

  return result.rows
    .map((row) => {
      const priceMad = toNumber(row.price_mad);
      if (!priceMad) return null;

      return {
        id: row.id,
        brand: row.brand,
        model: row.model,
        commercialName: row.commercial_name,
        trimName: row.trim_name,
        bodyStyle: row.body_style,
        availabilityScope: row.availability_scope,
        marketOrigin: row.market_origin,
        fiscalHp: row.fiscal_hp,
        seats: row.seats,
        modelYear: row.model_year,
        priceMad,
        sourceNames: toSourceNames(row.source_names),
        officialRecallCount: toNumber(row.official_recall_count) ?? 0,
        highSeverityRecallCount: toNumber(row.high_severity_recall_count) ?? 0,
        criticalRecallCount: toNumber(row.critical_recall_count) ?? 0,
      };
    })
    .filter((candidate): candidate is CatalogCandidate => candidate !== null);
}

export async function getCatalogCandidateById(id: string): Promise<CatalogCandidate | null> {
  const candidates = await getCatalogCandidates(8000);
  return candidates.find((candidate) => candidate.id === id) ?? null;
}
