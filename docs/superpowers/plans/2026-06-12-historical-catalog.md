# Historical Vehicle Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first historical used/import vehicle catalog slice back to 2000 and make `/[locale]/trouver` match against it.

**Architecture:** Keep the schema stable for this slice. Add semicolon CSV seed files, a dedicated importer that expands generation/version year ranges into `version_years` and used-market `price_observations`, and update the catalog loader to return one candidate per priced model year.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle schema definitions, `pg`, local Postgres Docker container, Node test runner with `tsx`.

---

### Task 1: Historical Seed Data

**Files:**
- Create: `docs/data/historical-morocco-versions-2000-2026.csv`
- Create: `docs/data/common-import-versions-2000-2026.csv`

- [ ] **Step 1: Create official Morocco historical seed rows**

Use semicolon-delimited rows with these columns:

```text
brand;model;generation_code;generation_name;starts_year;ends_year;commercial_name;trim_name;body_style;fuel_type;transmission;fiscal_hp;seats;year_start;year_end;price_min_mad;price_max_mad;annual_mileage_km;source_name;source_url;confidence;notes
```

- [ ] **Step 2: Create common-import seed rows**

Use the same columns. Import rows must be stored as `morocco_used_import` / `imported_edge_case` by the importer.

### Task 2: Historical Importer

**Files:**
- Create: `scripts/import-historical-catalog.ts`
- Modify: `package.json`

- [ ] **Step 1: Write a failing importer verification**

Run before implementation:

```bash
DATABASE_URL=postgresql://carsablanca:carsablanca@localhost:5432/carsablanca npm run db:import-historical
```

Expected: fail because the script is not defined.

- [ ] **Step 2: Implement importer**

The importer must:

- parse both CSVs;
- upsert source and batch rows;
- upsert brand, model, generation, and version rows;
- expand each row from `year_start` through `year_end`;
- create `version_years` rows with `is_available_new = false`;
- delete prior historical observations for the two manual historical sources before reimport;
- insert one used-market `price_observations` row per expanded model year;
- write linked `catalog_source_records`.

- [ ] **Step 3: Add package script**

Add:

```json
"db:import-historical": "tsx scripts/import-historical-catalog.ts"
```

### Task 3: Catalog Matching Query

**Files:**
- Modify: `lib/matching/catalog.ts`
- Modify: `lib/matching/catalog.test.ts`

- [ ] **Step 1: Add failing catalog test**

Assert that after historical import, the candidate loader returns at least one used Dacia Duster candidate earlier than 2020 and at least one imported-edge candidate.

- [ ] **Step 2: Update loader**

Return one candidate per priced version-year. Include `morocco_new`, `morocco_used`, and `morocco_imported_seen`. Keep current new-car candidates working.

### Task 4: Verification

**Files:**
- No production files.

- [ ] **Step 1: Run importer**

```bash
DATABASE_URL=postgresql://carsablanca:carsablanca@localhost:5432/carsablanca npm run db:import-historical
```

Expected: reports inserted/expanded historical rows.

- [ ] **Step 2: Run tests**

```bash
node --import tsx --test lib/matching/score.test.ts
DATABASE_URL=postgresql://carsablanca:carsablanca@localhost:5432/carsablanca node --import tsx --test lib/matching/catalog.test.ts
npx tsc --noEmit --pretty false
npx eslint 'lib/matching/*.ts' 'lib/matching/*.test.ts' scripts/import-historical-catalog.ts
```

- [ ] **Step 3: Browser verify**

Open:

```text
http://localhost:3000/fr/trouver?budget=6500&condition=all&usage=mixed&annualKm=15000&body=suv&fuel=diesel&seats=5
```

Expected: more than one result, including historical diesel SUVs such as Dacia Duster or comparable used/import models.
