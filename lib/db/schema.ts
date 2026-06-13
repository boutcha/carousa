import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const bodyStyle = pgEnum("body_style", [
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

export const fuelType = pgEnum("fuel_type", [
  "gasoline",
  "diesel",
  "hybrid",
  "plug_in_hybrid",
  "electric",
  "lpg",
  "other",
]);

export const transmissionType = pgEnum("transmission_type", [
  "manual",
  "automatic",
  "cvt",
  "dct",
  "other",
]);

export const marketOrigin = pgEnum("market_origin", [
  "morocco_official",
  "morocco_used_import",
  "europe_reference",
  "unknown_import",
]);

export const availabilityScope = pgEnum("availability_scope", [
  "new_ma",
  "used_ma",
  "imported_edge_case",
  "reference_only",
]);

export const priceType = pgEnum("price_type", [
  "official",
  "dealer_offer",
  "listing",
  "sold_estimate",
  "auction",
  "manual_estimate",
]);

export const marketContext = pgEnum("market_context", [
  "morocco_new",
  "morocco_used",
  "morocco_imported_seen",
  "europe_reference",
]);

export const sourceType = pgEnum("source_type", [
  "official",
  "dealer",
  "marketplace",
  "auction",
  "insurer",
  "bank",
  "manual",
  "other",
]);

export const issueSeverity = pgEnum("issue_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const issueSystem = pgEnum("issue_system", [
  "engine",
  "transmission",
  "electrical",
  "suspension",
  "brakes",
  "body",
  "interior",
  "software",
  "emissions",
  "other",
]);

export const financeProductType = pgEnum("finance_product_type", [
  "classic_credit",
  "loa",
  "mourabaha",
  "cash",
  "other",
]);

export const catalogRecordKind = pgEnum("catalog_record_kind", [
  "version",
  "model_price",
  "source_audit",
]);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    type: sourceType("type").notNull(),
    url: text("url"),
    publisher: varchar("publisher", { length: 160 }),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }),
    asOfDate: date("as_of_date"),
    confidence: real("confidence").default(0.5).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    index("sources_type_idx").on(table.type),
    index("sources_retrieved_at_idx").on(table.retrievedAt),
  ],
);

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    countryOfOrigin: varchar("country_of_origin", { length: 80 }),
    ...timestamps,
  },
  (table) => [uniqueIndex("brands_slug_idx").on(table.slug)],
);

export const vehicleModels = pgTable(
  "vehicle_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 140 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    segment: varchar("segment", { length: 80 }),
    bodyStyle: bodyStyle("body_style").notNull(),
    introducedYear: integer("introduced_year"),
    discontinuedYear: integer("discontinued_year"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("vehicle_models_brand_slug_idx").on(table.brandId, table.slug),
    index("vehicle_models_body_style_idx").on(table.bodyStyle),
  ],
);

export const vehicleGenerations = pgTable(
  "vehicle_generations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 140 }).notNull(),
    code: varchar("code", { length: 80 }),
    startsYear: integer("starts_year").notNull(),
    endsYear: integer("ends_year"),
    platform: varchar("platform", { length: 120 }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("vehicle_generations_model_code_idx").on(table.modelId, table.code),
    index("vehicle_generations_years_idx").on(table.startsYear, table.endsYear),
  ],
);

export const powertrains = pgTable(
  "powertrains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    generationId: uuid("generation_id").references(() => vehicleGenerations.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 180 }).notNull(),
    engineCode: varchar("engine_code", { length: 80 }),
    fuelType: fuelType("fuel_type").notNull(),
    transmission: transmissionType("transmission").notNull(),
    displacementCc: integer("displacement_cc"),
    cylinders: integer("cylinders"),
    horsepowerHp: integer("horsepower_hp"),
    torqueNm: integer("torque_nm"),
    fiscalHp: integer("fiscal_hp"),
    consumptionCityL100km: numeric("consumption_city_l_100km", { precision: 5, scale: 2 }),
    consumptionMixedL100km: numeric("consumption_mixed_l_100km", { precision: 5, scale: 2 }),
    consumptionHighwayL100km: numeric("consumption_highway_l_100km", {
      precision: 5,
      scale: 2,
    }),
    batteryKwh: numeric("battery_kwh", { precision: 6, scale: 2 }),
    ...timestamps,
  },
  (table) => [
    index("powertrains_generation_idx").on(table.generationId),
    index("powertrains_fuel_transmission_idx").on(table.fuelType, table.transmission),
  ],
);

export const vehicleVersions = pgTable(
  "vehicle_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => vehicleGenerations.id, { onDelete: "cascade" }),
    powertrainId: uuid("powertrain_id").references(() => powertrains.id, { onDelete: "set null" }),
    closestMaVersionId: uuid("closest_ma_version_id"),
    commercialName: varchar("commercial_name", { length: 180 }).notNull(),
    trimName: varchar("trim_name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    marketCode: varchar("market_code", { length: 8 }).default("MA").notNull(),
    marketOrigin: marketOrigin("market_origin").default("morocco_official").notNull(),
    availabilityScope: availabilityScope("availability_scope").default("used_ma").notNull(),
    fiscalHp: integer("fiscal_hp"),
    doors: integer("doors"),
    seats: integer("seats"),
    bodyStyle: bodyStyle("body_style").notNull(),
    sourceConfidence: real("source_confidence").default(0.5).notNull(),
    equivalenceNotes: text("equivalence_notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("vehicle_versions_generation_market_slug_idx").on(
      table.generationId,
      table.marketCode,
      table.slug,
    ),
    index("vehicle_versions_market_origin_idx").on(table.marketOrigin),
    index("vehicle_versions_scope_idx").on(table.availabilityScope),
    index("vehicle_versions_closest_ma_idx").on(table.closestMaVersionId),
    foreignKey({
      name: "vehicle_versions_closest_ma_version_id_fk",
      columns: [table.closestMaVersionId],
      foreignColumns: [table.id],
    }).onDelete("set null"),
  ],
);

export const versionYears = pgTable(
  "version_years",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleVersionId: uuid("vehicle_version_id")
      .notNull()
      .references(() => vehicleVersions.id, { onDelete: "cascade" }),
    modelYear: integer("model_year").notNull(),
    firstRegistrationYearStart: integer("first_registration_year_start"),
    firstRegistrationYearEnd: integer("first_registration_year_end"),
    officialPriceMad: numeric("official_price_mad", { precision: 12, scale: 2 }),
    isAvailableNew: boolean("is_available_new").default(false).notNull(),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("version_years_version_year_idx").on(table.vehicleVersionId, table.modelYear),
    index("version_years_available_new_idx").on(table.isAvailableNew),
  ],
);

export const features = pgTable(
  "features",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    category: varchar("category", { length: 80 }).notNull(),
    name: varchar("name", { length: 140 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("features_slug_idx").on(table.slug),
    index("features_category_idx").on(table.category),
  ],
);

export const versionFeatures = pgTable(
  "version_features",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleVersionId: uuid("vehicle_version_id")
      .notNull()
      .references(() => vehicleVersions.id, { onDelete: "cascade" }),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    modelYear: integer("model_year"),
    availability: varchar("availability", { length: 40 }).default("unknown").notNull(),
    packageName: varchar("package_name", { length: 140 }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("version_features_version_feature_year_idx").on(
      table.vehicleVersionId,
      table.featureId,
      table.modelYear,
    ),
    index("version_features_feature_idx").on(table.featureId),
  ],
);

export const priceObservations = pgTable(
  "price_observations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleVersionId: uuid("vehicle_version_id")
      .notNull()
      .references(() => vehicleVersions.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    countryCode: varchar("country_code", { length: 2 }).default("MA").notNull(),
    marketContext: marketContext("market_context").notNull(),
    priceType: priceType("price_type").notNull(),
    currency: varchar("currency", { length: 3 }).default("MAD").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    priceMad: numeric("price_mad", { precision: 12, scale: 2 }),
    modelYear: integer("model_year"),
    mileageKm: integer("mileage_km"),
    condition: varchar("condition", { length: 80 }),
    city: varchar("city", { length: 120 }),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    sourceUrl: text("source_url"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("price_observations_version_observed_idx").on(
      table.vehicleVersionId,
      table.observedAt,
    ),
    index("price_observations_market_idx").on(table.marketContext, table.countryCode),
    index("price_observations_mileage_idx").on(table.mileageKm),
  ],
);

export const depreciationCurves = pgTable(
  "depreciation_curves",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleVersionId: uuid("vehicle_version_id")
      .notNull()
      .references(() => vehicleVersions.id, { onDelete: "cascade" }),
    marketContext: marketContext("market_context").notNull(),
    modelYear: integer("model_year").notNull(),
    mileageBandMinKm: integer("mileage_band_min_km").default(0).notNull(),
    mileageBandMaxKm: integer("mileage_band_max_km").notNull(),
    valueMedianMad: numeric("value_median_mad", { precision: 12, scale: 2 }).notNull(),
    valueMinMad: numeric("value_min_mad", { precision: 12, scale: 2 }),
    valueMaxMad: numeric("value_max_mad", { precision: 12, scale: 2 }),
    confidence: real("confidence").default(0.5).notNull(),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("depreciation_curves_version_context_year_band_idx").on(
      table.vehicleVersionId,
      table.marketContext,
      table.modelYear,
      table.mileageBandMinKm,
      table.mileageBandMaxKm,
    ),
    index("depreciation_curves_market_idx").on(table.marketContext),
  ],
);

export const knownIssues = pgTable(
  "known_issues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description").notNull(),
    severity: issueSeverity("severity").notNull(),
    affectedSystem: issueSystem("affected_system").notNull(),
    typicalMileageMinKm: integer("typical_mileage_min_km"),
    typicalMileageMaxKm: integer("typical_mileage_max_km"),
    confidence: real("confidence").default(0.5).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("known_issues_slug_idx").on(table.slug),
    index("known_issues_system_severity_idx").on(table.affectedSystem, table.severity),
  ],
);

export const issueApplicability = pgTable(
  "issue_applicability",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    knownIssueId: uuid("known_issue_id")
      .notNull()
      .references(() => knownIssues.id, { onDelete: "cascade" }),
    generationId: uuid("generation_id").references(() => vehicleGenerations.id, {
      onDelete: "cascade",
    }),
    powertrainId: uuid("powertrain_id").references(() => powertrains.id, {
      onDelete: "cascade",
    }),
    vehicleVersionId: uuid("vehicle_version_id").references(() => vehicleVersions.id, {
      onDelete: "cascade",
    }),
    modelYearStart: integer("model_year_start"),
    modelYearEnd: integer("model_year_end"),
    marketCode: varchar("market_code", { length: 8 }),
    notes: text("notes"),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("issue_applicability_issue_idx").on(table.knownIssueId),
    index("issue_applicability_generation_idx").on(table.generationId),
    index("issue_applicability_powertrain_idx").on(table.powertrainId),
    index("issue_applicability_version_idx").on(table.vehicleVersionId),
  ],
);

export const repairCostEstimates = pgTable(
  "repair_cost_estimates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    knownIssueId: uuid("known_issue_id")
      .notNull()
      .references(() => knownIssues.id, { onDelete: "cascade" }),
    countryCode: varchar("country_code", { length: 2 }).default("MA").notNull(),
    costMinMad: numeric("cost_min_mad", { precision: 10, scale: 2 }),
    costMedianMad: numeric("cost_median_mad", { precision: 10, scale: 2 }).notNull(),
    costMaxMad: numeric("cost_max_mad", { precision: 10, scale: 2 }),
    laborHoursMin: numeric("labor_hours_min", { precision: 5, scale: 2 }),
    laborHoursMax: numeric("labor_hours_max", { precision: 5, scale: 2 }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    observedAt: timestamp("observed_at", { withTimezone: true }).defaultNow().notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("repair_cost_estimates_issue_country_idx").on(table.knownIssueId, table.countryCode),
  ],
);

export const maintenanceSchedules = pgTable(
  "maintenance_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleVersionId: uuid("vehicle_version_id").references(() => vehicleVersions.id, {
      onDelete: "cascade",
    }),
    generationId: uuid("generation_id").references(() => vehicleGenerations.id, {
      onDelete: "cascade",
    }),
    powertrainId: uuid("powertrain_id").references(() => powertrains.id, {
      onDelete: "cascade",
    }),
    intervalKm: integer("interval_km"),
    intervalMonths: integer("interval_months"),
    itemName: varchar("item_name", { length: 180 }).notNull(),
    costMinMad: numeric("cost_min_mad", { precision: 10, scale: 2 }),
    costMedianMad: numeric("cost_median_mad", { precision: 10, scale: 2 }),
    costMaxMad: numeric("cost_max_mad", { precision: 10, scale: 2 }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("maintenance_schedules_version_idx").on(table.vehicleVersionId),
    index("maintenance_schedules_generation_idx").on(table.generationId),
    index("maintenance_schedules_powertrain_idx").on(table.powertrainId),
  ],
);

export const fuelPrices = pgTable(
  "fuel_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fuelType: fuelType("fuel_type").notNull(),
    countryCode: varchar("country_code", { length: 2 }).default("MA").notNull(),
    region: varchar("region", { length: 120 }),
    priceMadPerLiter: numeric("price_mad_per_liter", { precision: 6, scale: 2 }).notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fuel_prices_fuel_country_region_observed_idx").on(
      table.fuelType,
      table.countryCode,
      table.region,
      table.observedAt,
    ),
  ],
);

export const insuranceTariffs = pgTable(
  "insurance_tariffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    countryCode: varchar("country_code", { length: 2 }).default("MA").notNull(),
    coverageType: varchar("coverage_type", { length: 80 }).notNull(),
    fuelType: fuelType("fuel_type"),
    fiscalHpMin: integer("fiscal_hp_min").notNull(),
    fiscalHpMax: integer("fiscal_hp_max").notNull(),
    vehicleValueMinMad: numeric("vehicle_value_min_mad", { precision: 12, scale: 2 }),
    vehicleValueMaxMad: numeric("vehicle_value_max_mad", { precision: 12, scale: 2 }),
    annualPremiumMinMad: numeric("annual_premium_min_mad", { precision: 10, scale: 2 }),
    annualPremiumMedianMad: numeric("annual_premium_median_mad", {
      precision: 10,
      scale: 2,
    }).notNull(),
    annualPremiumMaxMad: numeric("annual_premium_max_mad", { precision: 10, scale: 2 }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("insurance_tariffs_country_fiscal_idx").on(
      table.countryCode,
      table.fiscalHpMin,
      table.fiscalHpMax,
    ),
  ],
);

export const financeProducts = pgTable(
  "finance_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerName: varchar("provider_name", { length: 160 }).notNull(),
    productType: financeProductType("product_type").notNull(),
    countryCode: varchar("country_code", { length: 2 }).default("MA").notNull(),
    minDurationMonths: integer("min_duration_months"),
    maxDurationMonths: integer("max_duration_months"),
    minDownPaymentPercent: numeric("min_down_payment_percent", { precision: 5, scale: 2 }),
    annualRatePercent: numeric("annual_rate_percent", { precision: 5, scale: 2 }),
    marginRatePercent: numeric("margin_rate_percent", { precision: 5, scale: 2 }),
    feesFixedMad: numeric("fees_fixed_mad", { precision: 10, scale: 2 }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("finance_products_country_type_idx").on(table.countryCode, table.productType),
    index("finance_products_provider_idx").on(table.providerName),
  ],
);

export const catalogImportBatches = pgTable(
  "catalog_import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
    sourceFileSummary: jsonb("source_file_summary").$type<Record<string, unknown>>(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("catalog_import_batches_name_idx").on(table.name),
    index("catalog_import_batches_imported_at_idx").on(table.importedAt),
  ],
);

export const catalogSourceRecords = pgTable(
  "catalog_source_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => catalogImportBatches.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    sourceName: varchar("source_name", { length: 120 }).notNull(),
    sourceKind: catalogRecordKind("source_kind").notNull(),
    sourceRecordId: varchar("source_record_id", { length: 260 }).notNull(),
    sourceBrandId: varchar("source_brand_id", { length: 80 }),
    sourceBrandName: varchar("source_brand_name", { length: 180 }),
    sourceBrandSlug: varchar("source_brand_slug", { length: 180 }),
    sourceModelId: varchar("source_model_id", { length: 80 }),
    sourceModelName: varchar("source_model_name", { length: 220 }),
    sourceModelSlug: varchar("source_model_slug", { length: 220 }),
    sourceVersionId: varchar("source_version_id", { length: 80 }),
    sourceVersionName: varchar("source_version_name", { length: 260 }),
    sourceVersionSlug: varchar("source_version_slug", { length: 260 }),
    sourceTrimName: varchar("source_trim_name", { length: 180 }),
    brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
    vehicleModelId: uuid("vehicle_model_id").references(() => vehicleModels.id, {
      onDelete: "set null",
    }),
    vehicleVersionId: uuid("vehicle_version_id").references(() => vehicleVersions.id, {
      onDelete: "set null",
    }),
    sourceUrl: text("source_url"),
    modelImageUrl: text("model_image_url"),
    category: varchar("category", { length: 120 }),
    energy: varchar("energy", { length: 120 }),
    horsepowerCh: integer("horsepower_ch"),
    fiscalHpCv: integer("fiscal_hp_cv"),
    mixedConsumptionL100km: numeric("mixed_consumption_l_100km", { precision: 6, scale: 2 }),
    modelYear: integer("model_year"),
    publicPriceMad: numeric("public_price_mad", { precision: 12, scale: 2 }),
    promoPriceMad: numeric("promo_price_mad", { precision: 12, scale: 2 }),
    turnkeyPriceMad: numeric("turnkey_price_mad", { precision: 12, scale: 2 }),
    confidence: real("confidence").default(0.5).notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).defaultNow().notNull(),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("catalog_source_records_source_record_idx").on(
      table.sourceName,
      table.sourceRecordId,
    ),
    index("catalog_source_records_source_idx").on(table.sourceId),
    index("catalog_source_records_brand_model_idx").on(table.brandId, table.vehicleModelId),
    index("catalog_source_records_version_idx").on(table.vehicleVersionId),
    index("catalog_source_records_kind_idx").on(table.sourceKind),
  ],
);

export type Brand = InferSelectModel<typeof brands>;
export type NewBrand = InferInsertModel<typeof brands>;
export type VehicleModel = InferSelectModel<typeof vehicleModels>;
export type VehicleVersion = InferSelectModel<typeof vehicleVersions>;
export type NewVehicleVersion = InferInsertModel<typeof vehicleVersions>;
export type PriceObservation = InferSelectModel<typeof priceObservations>;
export type KnownIssue = InferSelectModel<typeof knownIssues>;
export type CatalogSourceRecord = InferSelectModel<typeof catalogSourceRecords>;
