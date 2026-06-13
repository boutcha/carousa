CREATE TYPE "public"."availability_scope" AS ENUM('new_ma', 'used_ma', 'imported_edge_case', 'reference_only');--> statement-breakpoint
CREATE TYPE "public"."body_style" AS ENUM('hatchback', 'sedan', 'suv', 'crossover', 'wagon', 'van', 'pickup', 'coupe', 'convertible', 'other');--> statement-breakpoint
CREATE TYPE "public"."finance_product_type" AS ENUM('classic_credit', 'loa', 'mourabaha', 'cash', 'other');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('gasoline', 'diesel', 'hybrid', 'plug_in_hybrid', 'electric', 'lpg', 'other');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."issue_system" AS ENUM('engine', 'transmission', 'electrical', 'suspension', 'brakes', 'body', 'interior', 'software', 'emissions', 'other');--> statement-breakpoint
CREATE TYPE "public"."market_context" AS ENUM('morocco_new', 'morocco_used', 'morocco_imported_seen', 'europe_reference');--> statement-breakpoint
CREATE TYPE "public"."market_origin" AS ENUM('morocco_official', 'morocco_used_import', 'europe_reference', 'unknown_import');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('official', 'dealer_offer', 'listing', 'sold_estimate', 'auction', 'manual_estimate');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('official', 'dealer', 'marketplace', 'auction', 'insurer', 'bank', 'manual', 'other');--> statement-breakpoint
CREATE TYPE "public"."transmission_type" AS ENUM('manual', 'automatic', 'cvt', 'dct', 'other');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"country_of_origin" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "depreciation_curves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_version_id" uuid NOT NULL,
	"market_context" "market_context" NOT NULL,
	"model_year" integer NOT NULL,
	"mileage_band_min_km" integer DEFAULT 0 NOT NULL,
	"mileage_band_max_km" integer NOT NULL,
	"value_median_mad" numeric(12, 2) NOT NULL,
	"value_min_mad" numeric(12, 2),
	"value_max_mad" numeric(12, 2),
	"confidence" real DEFAULT 0.5 NOT NULL,
	"source_id" uuid,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(80) NOT NULL,
	"name" varchar(140) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_name" varchar(160) NOT NULL,
	"product_type" "finance_product_type" NOT NULL,
	"country_code" varchar(2) DEFAULT 'MA' NOT NULL,
	"min_duration_months" integer,
	"max_duration_months" integer,
	"min_down_payment_percent" numeric(5, 2),
	"annual_rate_percent" numeric(5, 2),
	"margin_rate_percent" numeric(5, 2),
	"fees_fixed_mad" numeric(10, 2),
	"source_id" uuid,
	"valid_from" date,
	"valid_to" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuel_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"country_code" varchar(2) DEFAULT 'MA' NOT NULL,
	"region" varchar(120),
	"price_mad_per_liter" numeric(6, 2) NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_tariffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" varchar(2) DEFAULT 'MA' NOT NULL,
	"coverage_type" varchar(80) NOT NULL,
	"fuel_type" "fuel_type",
	"fiscal_hp_min" integer NOT NULL,
	"fiscal_hp_max" integer NOT NULL,
	"vehicle_value_min_mad" numeric(12, 2),
	"vehicle_value_max_mad" numeric(12, 2),
	"annual_premium_min_mad" numeric(10, 2),
	"annual_premium_median_mad" numeric(10, 2) NOT NULL,
	"annual_premium_max_mad" numeric(10, 2),
	"source_id" uuid,
	"valid_from" date,
	"valid_to" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_applicability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"known_issue_id" uuid NOT NULL,
	"generation_id" uuid,
	"powertrain_id" uuid,
	"vehicle_version_id" uuid,
	"model_year_start" integer,
	"model_year_end" integer,
	"market_code" varchar(8),
	"notes" text,
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "known_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(180) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text NOT NULL,
	"severity" "issue_severity" NOT NULL,
	"affected_system" "issue_system" NOT NULL,
	"typical_mileage_min_km" integer,
	"typical_mileage_max_km" integer,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_version_id" uuid,
	"generation_id" uuid,
	"powertrain_id" uuid,
	"interval_km" integer,
	"interval_months" integer,
	"item_name" varchar(180) NOT NULL,
	"cost_min_mad" numeric(10, 2),
	"cost_median_mad" numeric(10, 2),
	"cost_max_mad" numeric(10, 2),
	"source_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "powertrains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid,
	"name" varchar(180) NOT NULL,
	"engine_code" varchar(80),
	"fuel_type" "fuel_type" NOT NULL,
	"transmission" "transmission_type" NOT NULL,
	"displacement_cc" integer,
	"cylinders" integer,
	"horsepower_hp" integer,
	"torque_nm" integer,
	"fiscal_hp" integer,
	"consumption_city_l_100km" numeric(5, 2),
	"consumption_mixed_l_100km" numeric(5, 2),
	"consumption_highway_l_100km" numeric(5, 2),
	"battery_kwh" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_version_id" uuid NOT NULL,
	"source_id" uuid,
	"country_code" varchar(2) DEFAULT 'MA' NOT NULL,
	"market_context" "market_context" NOT NULL,
	"price_type" "price_type" NOT NULL,
	"currency" varchar(3) DEFAULT 'MAD' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"price_mad" numeric(12, 2),
	"model_year" integer,
	"mileage_km" integer,
	"condition" varchar(80),
	"city" varchar(120),
	"observed_at" timestamp with time zone NOT NULL,
	"source_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_cost_estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"known_issue_id" uuid NOT NULL,
	"country_code" varchar(2) DEFAULT 'MA' NOT NULL,
	"cost_min_mad" numeric(10, 2),
	"cost_median_mad" numeric(10, 2) NOT NULL,
	"cost_max_mad" numeric(10, 2),
	"labor_hours_min" numeric(5, 2),
	"labor_hours_max" numeric(5, 2),
	"source_id" uuid,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"type" "source_type" NOT NULL,
	"url" text,
	"publisher" varchar(160),
	"retrieved_at" timestamp with time zone,
	"as_of_date" date,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"code" varchar(80),
	"starts_year" integer NOT NULL,
	"ends_year" integer,
	"platform" varchar(120),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"segment" varchar(80),
	"body_style" "body_style" NOT NULL,
	"introduced_year" integer,
	"discontinued_year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid NOT NULL,
	"powertrain_id" uuid,
	"closest_ma_version_id" uuid,
	"commercial_name" varchar(180) NOT NULL,
	"trim_name" varchar(180) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"market_code" varchar(8) DEFAULT 'MA' NOT NULL,
	"market_origin" "market_origin" DEFAULT 'morocco_official' NOT NULL,
	"availability_scope" "availability_scope" DEFAULT 'used_ma' NOT NULL,
	"fiscal_hp" integer,
	"doors" integer,
	"seats" integer,
	"body_style" "body_style" NOT NULL,
	"source_confidence" real DEFAULT 0.5 NOT NULL,
	"equivalence_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "version_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_version_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"model_year" integer,
	"availability" varchar(40) DEFAULT 'unknown' NOT NULL,
	"package_name" varchar(140),
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "version_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_version_id" uuid NOT NULL,
	"model_year" integer NOT NULL,
	"first_registration_year_start" integer,
	"first_registration_year_end" integer,
	"official_price_mad" numeric(12, 2),
	"is_available_new" boolean DEFAULT false NOT NULL,
	"source_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "depreciation_curves" ADD CONSTRAINT "depreciation_curves_vehicle_version_id_vehicle_versions_id_fk" FOREIGN KEY ("vehicle_version_id") REFERENCES "public"."vehicle_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "depreciation_curves" ADD CONSTRAINT "depreciation_curves_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_products" ADD CONSTRAINT "finance_products_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_prices" ADD CONSTRAINT "fuel_prices_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_tariffs" ADD CONSTRAINT "insurance_tariffs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_applicability" ADD CONSTRAINT "issue_applicability_known_issue_id_known_issues_id_fk" FOREIGN KEY ("known_issue_id") REFERENCES "public"."known_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_applicability" ADD CONSTRAINT "issue_applicability_generation_id_vehicle_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."vehicle_generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_applicability" ADD CONSTRAINT "issue_applicability_powertrain_id_powertrains_id_fk" FOREIGN KEY ("powertrain_id") REFERENCES "public"."powertrains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_applicability" ADD CONSTRAINT "issue_applicability_vehicle_version_id_vehicle_versions_id_fk" FOREIGN KEY ("vehicle_version_id") REFERENCES "public"."vehicle_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_applicability" ADD CONSTRAINT "issue_applicability_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_vehicle_version_id_vehicle_versions_id_fk" FOREIGN KEY ("vehicle_version_id") REFERENCES "public"."vehicle_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_generation_id_vehicle_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."vehicle_generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_powertrain_id_powertrains_id_fk" FOREIGN KEY ("powertrain_id") REFERENCES "public"."powertrains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "powertrains" ADD CONSTRAINT "powertrains_generation_id_vehicle_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."vehicle_generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_vehicle_version_id_vehicle_versions_id_fk" FOREIGN KEY ("vehicle_version_id") REFERENCES "public"."vehicle_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_cost_estimates" ADD CONSTRAINT "repair_cost_estimates_known_issue_id_known_issues_id_fk" FOREIGN KEY ("known_issue_id") REFERENCES "public"."known_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_cost_estimates" ADD CONSTRAINT "repair_cost_estimates_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_generations" ADD CONSTRAINT "vehicle_generations_model_id_vehicle_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_generation_id_vehicle_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."vehicle_generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_powertrain_id_powertrains_id_fk" FOREIGN KEY ("powertrain_id") REFERENCES "public"."powertrains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_closest_ma_version_id_fk" FOREIGN KEY ("closest_ma_version_id") REFERENCES "public"."vehicle_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_features" ADD CONSTRAINT "version_features_vehicle_version_id_vehicle_versions_id_fk" FOREIGN KEY ("vehicle_version_id") REFERENCES "public"."vehicle_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_features" ADD CONSTRAINT "version_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_features" ADD CONSTRAINT "version_features_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_years" ADD CONSTRAINT "version_years_vehicle_version_id_vehicle_versions_id_fk" FOREIGN KEY ("vehicle_version_id") REFERENCES "public"."vehicle_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_years" ADD CONSTRAINT "version_years_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "depreciation_curves_version_context_year_band_idx" ON "depreciation_curves" USING btree ("vehicle_version_id","market_context","model_year","mileage_band_min_km","mileage_band_max_km");--> statement-breakpoint
CREATE INDEX "depreciation_curves_market_idx" ON "depreciation_curves" USING btree ("market_context");--> statement-breakpoint
CREATE UNIQUE INDEX "features_slug_idx" ON "features" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "features_category_idx" ON "features" USING btree ("category");--> statement-breakpoint
CREATE INDEX "finance_products_country_type_idx" ON "finance_products" USING btree ("country_code","product_type");--> statement-breakpoint
CREATE INDEX "finance_products_provider_idx" ON "finance_products" USING btree ("provider_name");--> statement-breakpoint
CREATE UNIQUE INDEX "fuel_prices_fuel_country_region_observed_idx" ON "fuel_prices" USING btree ("fuel_type","country_code","region","observed_at");--> statement-breakpoint
CREATE INDEX "insurance_tariffs_country_fiscal_idx" ON "insurance_tariffs" USING btree ("country_code","fiscal_hp_min","fiscal_hp_max");--> statement-breakpoint
CREATE INDEX "issue_applicability_issue_idx" ON "issue_applicability" USING btree ("known_issue_id");--> statement-breakpoint
CREATE INDEX "issue_applicability_generation_idx" ON "issue_applicability" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "issue_applicability_powertrain_idx" ON "issue_applicability" USING btree ("powertrain_id");--> statement-breakpoint
CREATE INDEX "issue_applicability_version_idx" ON "issue_applicability" USING btree ("vehicle_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "known_issues_slug_idx" ON "known_issues" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "known_issues_system_severity_idx" ON "known_issues" USING btree ("affected_system","severity");--> statement-breakpoint
CREATE INDEX "maintenance_schedules_version_idx" ON "maintenance_schedules" USING btree ("vehicle_version_id");--> statement-breakpoint
CREATE INDEX "maintenance_schedules_generation_idx" ON "maintenance_schedules" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "maintenance_schedules_powertrain_idx" ON "maintenance_schedules" USING btree ("powertrain_id");--> statement-breakpoint
CREATE INDEX "powertrains_generation_idx" ON "powertrains" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "powertrains_fuel_transmission_idx" ON "powertrains" USING btree ("fuel_type","transmission");--> statement-breakpoint
CREATE INDEX "price_observations_version_observed_idx" ON "price_observations" USING btree ("vehicle_version_id","observed_at");--> statement-breakpoint
CREATE INDEX "price_observations_market_idx" ON "price_observations" USING btree ("market_context","country_code");--> statement-breakpoint
CREATE INDEX "price_observations_mileage_idx" ON "price_observations" USING btree ("mileage_km");--> statement-breakpoint
CREATE INDEX "repair_cost_estimates_issue_country_idx" ON "repair_cost_estimates" USING btree ("known_issue_id","country_code");--> statement-breakpoint
CREATE INDEX "sources_type_idx" ON "sources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sources_retrieved_at_idx" ON "sources" USING btree ("retrieved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_generations_model_code_idx" ON "vehicle_generations" USING btree ("model_id","code");--> statement-breakpoint
CREATE INDEX "vehicle_generations_years_idx" ON "vehicle_generations" USING btree ("starts_year","ends_year");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_models_brand_slug_idx" ON "vehicle_models" USING btree ("brand_id","slug");--> statement-breakpoint
CREATE INDEX "vehicle_models_body_style_idx" ON "vehicle_models" USING btree ("body_style");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_versions_generation_market_slug_idx" ON "vehicle_versions" USING btree ("generation_id","market_code","slug");--> statement-breakpoint
CREATE INDEX "vehicle_versions_market_origin_idx" ON "vehicle_versions" USING btree ("market_origin");--> statement-breakpoint
CREATE INDEX "vehicle_versions_scope_idx" ON "vehicle_versions" USING btree ("availability_scope");--> statement-breakpoint
CREATE INDEX "vehicle_versions_closest_ma_idx" ON "vehicle_versions" USING btree ("closest_ma_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "version_features_version_feature_year_idx" ON "version_features" USING btree ("vehicle_version_id","feature_id","model_year");--> statement-breakpoint
CREATE INDEX "version_features_feature_idx" ON "version_features" USING btree ("feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "version_years_version_year_idx" ON "version_years" USING btree ("vehicle_version_id","model_year");--> statement-breakpoint
CREATE INDEX "version_years_available_new_idx" ON "version_years" USING btree ("is_available_new");