\set ON_ERROR_STOP on

DO $$
DECLARE
  missing text;
BEGIN
  WITH expected_tables(table_name) AS (
    VALUES
      ('brands'),
      ('vehicle_models'),
      ('vehicle_generations'),
      ('powertrains'),
      ('vehicle_versions'),
      ('version_years'),
      ('features'),
      ('version_features'),
      ('sources'),
      ('price_observations'),
      ('depreciation_curves'),
      ('known_issues'),
      ('issue_applicability'),
      ('repair_cost_estimates'),
      ('maintenance_schedules'),
      ('fuel_prices'),
      ('insurance_tariffs'),
      ('finance_products'),
      ('catalog_import_batches'),
      ('catalog_source_records')
  ),
  missing_tables AS (
    SELECT expected_tables.table_name
    FROM expected_tables
    LEFT JOIN information_schema.tables
      ON information_schema.tables.table_schema = 'public'
      AND information_schema.tables.table_name = expected_tables.table_name
    WHERE information_schema.tables.table_name IS NULL
  )
  SELECT string_agg(table_name, ', ' ORDER BY table_name)
  INTO missing
  FROM missing_tables;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'missing expected tables: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  missing text;
BEGIN
  WITH expected_enums(type_name) AS (
    VALUES
      ('body_style'),
      ('fuel_type'),
      ('transmission_type'),
      ('market_origin'),
      ('availability_scope'),
      ('price_type'),
      ('market_context'),
      ('source_type'),
      ('issue_severity'),
      ('issue_system'),
      ('finance_product_type'),
      ('catalog_record_kind')
  ),
  missing_enums AS (
    SELECT expected_enums.type_name
    FROM expected_enums
    LEFT JOIN pg_type ON pg_type.typname = expected_enums.type_name
    WHERE pg_type.typname IS NULL
  )
  SELECT string_agg(type_name, ', ' ORDER BY type_name)
  INTO missing
  FROM missing_enums;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'missing expected enums: %', missing;
  END IF;
END $$;

SELECT
  tc.constraint_name,
  tc.table_name
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'vehicle_models',
    'vehicle_generations',
    'vehicle_versions',
    'version_years',
    'version_features',
    'price_observations',
    'depreciation_curves',
    'issue_applicability',
    'repair_cost_estimates',
    'maintenance_schedules',
    'catalog_source_records'
  )
ORDER BY tc.table_name, tc.constraint_name;
