CREATE TYPE "public"."catalog_record_kind" AS ENUM('version', 'model_price', 'source_audit');--> statement-breakpoint
CREATE TABLE "catalog_import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(180) NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_file_summary" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_source_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"source_id" uuid,
	"source_name" varchar(120) NOT NULL,
	"source_kind" "catalog_record_kind" NOT NULL,
	"source_record_id" varchar(260) NOT NULL,
	"source_brand_id" varchar(80),
	"source_brand_name" varchar(180),
	"source_brand_slug" varchar(180),
	"source_model_id" varchar(80),
	"source_model_name" varchar(220),
	"source_model_slug" varchar(220),
	"source_version_id" varchar(80),
	"source_version_name" varchar(260),
	"source_version_slug" varchar(260),
	"source_trim_name" varchar(180),
	"brand_id" uuid,
	"vehicle_model_id" uuid,
	"vehicle_version_id" uuid,
	"source_url" text,
	"model_image_url" text,
	"category" varchar(120),
	"energy" varchar(120),
	"horsepower_ch" integer,
	"fiscal_hp_cv" integer,
	"mixed_consumption_l_100km" numeric(6, 2),
	"model_year" integer,
	"public_price_mad" numeric(12, 2),
	"promo_price_mad" numeric(12, 2),
	"turnkey_price_mad" numeric(12, 2),
	"confidence" real DEFAULT 0.5 NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_source_records" ADD CONSTRAINT "catalog_source_records_batch_id_catalog_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."catalog_import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_source_records" ADD CONSTRAINT "catalog_source_records_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_source_records" ADD CONSTRAINT "catalog_source_records_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_source_records" ADD CONSTRAINT "catalog_source_records_vehicle_model_id_vehicle_models_id_fk" FOREIGN KEY ("vehicle_model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_source_records" ADD CONSTRAINT "catalog_source_records_vehicle_version_id_vehicle_versions_id_fk" FOREIGN KEY ("vehicle_version_id") REFERENCES "public"."vehicle_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_import_batches_name_idx" ON "catalog_import_batches" USING btree ("name");--> statement-breakpoint
CREATE INDEX "catalog_import_batches_imported_at_idx" ON "catalog_import_batches" USING btree ("imported_at");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_source_records_source_record_idx" ON "catalog_source_records" USING btree ("source_name","source_record_id");--> statement-breakpoint
CREATE INDEX "catalog_source_records_source_idx" ON "catalog_source_records" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "catalog_source_records_brand_model_idx" ON "catalog_source_records" USING btree ("brand_id","vehicle_model_id");--> statement-breakpoint
CREATE INDEX "catalog_source_records_version_idx" ON "catalog_source_records" USING btree ("vehicle_version_id");--> statement-breakpoint
CREATE INDEX "catalog_source_records_kind_idx" ON "catalog_source_records" USING btree ("source_kind");