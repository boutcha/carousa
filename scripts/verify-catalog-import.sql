\set ON_ERROR_STOP on

DO $$
DECLARE
  missing text;
BEGIN
  WITH expected_tables(table_name) AS (
    VALUES
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
    RAISE EXCEPTION 'missing expected catalog tables: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  missing text;
BEGIN
  WITH expected_enums(type_name) AS (
    VALUES
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
    RAISE EXCEPTION 'missing expected catalog enums: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  source_records integer;
  canonical_brands integer;
  canonical_models integer;
  canonical_versions integer;
  source_count integer;
BEGIN
  SELECT count(*) INTO source_records FROM catalog_source_records;
  SELECT count(*) INTO canonical_brands FROM brands;
  SELECT count(*) INTO canonical_models FROM vehicle_models;
  SELECT count(*) INTO canonical_versions FROM vehicle_versions;
  SELECT count(*) INTO source_count FROM sources;

  IF source_records < 2600 THEN
    RAISE EXCEPTION 'expected at least 2600 catalog source records, found %', source_records;
  END IF;

  IF canonical_brands < 70 THEN
    RAISE EXCEPTION 'expected at least 70 canonical brands, found %', canonical_brands;
  END IF;

  IF canonical_models < 360 THEN
    RAISE EXCEPTION 'expected at least 360 canonical models, found %', canonical_models;
  END IF;

  IF canonical_versions < 1200 THEN
    RAISE EXCEPTION 'expected at least 1200 canonical versions, found %', canonical_versions;
  END IF;

  IF source_count < 60 THEN
    RAISE EXCEPTION 'expected at least 60 source records, found %', source_count;
  END IF;
END $$;

SELECT
  source_name,
  source_kind,
  count(*) AS record_count
FROM catalog_source_records
GROUP BY source_name, source_kind
ORDER BY source_name, source_kind;
