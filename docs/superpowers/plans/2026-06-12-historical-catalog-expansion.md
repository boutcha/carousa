# Historical Catalog Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Broaden the historical vehicle catalog so 2000s Moroccan used-market matching covers mainstream missing brands and model families.

**Architecture:** Keep the existing schema and importer. Expand the two semicolon CSV seed files, lower the catalog loader's used-car price floor so older cars remain matchable, and verify the local Postgres import plus the matching page.

**Tech Stack:** TypeScript, Drizzle-backed Postgres, `pg` importer, Node test runner with `tsx`, Next.js App Router.

---

### Task 1: Coverage Regression

**Files:**
- Modify: `lib/matching/catalog.test.ts`

- [x] **Step 1: Add a failing coverage test**

Add a test that expects historical candidates for Chevrolet Aveo, Honda Civic, Mazda 3, Mitsubishi Pajero, Renault Scenic, Skoda Octavia, Suzuki Swift, and Volkswagen Passat. The test must also require at least one `used_ma` candidate from 2008 or earlier below 50,000 MAD.

- [x] **Step 2: Verify the test fails**

Run:

```bash
DATABASE_URL=postgresql://carsablanca:carsablanca@localhost:5432/carsablanca node --import tsx --test lib/matching/catalog.test.ts
```

Expected: fail on the first missing family.

### Task 2: Seed Expansion

**Files:**
- Modify: `docs/data/historical-morocco-versions-2000-2026.csv`
- Modify: `docs/data/common-import-versions-2000-2026.csv`

- [x] **Step 1: Add official Morocco historical rows**

Append rows for missing mainstream Moroccan-market families: Chevrolet, Honda, Mazda, Mitsubishi, Skoda, Suzuki, Volvo, Land Rover, Jeep, SsangYong, additional Renault/Peugeot/Citroen/Fiat/Ford/Hyundai/Kia/Nissan/Opel/Toyota/Volkswagen/Dacia families, vans, pickups, and common SUVs.

- [x] **Step 2: Add common import edge-case rows**

Append European import rows for models commonly seen in used listings but not necessarily official Moroccan trims, keeping `source_name` as `Carsablanca common-import baseline`.

### Task 3: Loader Floor

**Files:**
- Modify: `lib/matching/catalog.ts`

- [x] **Step 1: Lower the price floor**

Change the candidate floor from 50,000 MAD to 15,000 MAD so older 2000s city cars remain available to the matcher.

- [x] **Step 2: Raise the default limit**

Raise the default candidate limit high enough for the expanded version-year catalog.

### Task 4: Import And Verify

**Files:**
- No new production files.

- [x] **Step 1: Apply import**

```bash
DATABASE_URL=postgresql://carsablanca:carsablanca@localhost:5432/carsablanca npm run db:import-historical
```

- [x] **Step 2: Run focused verification**

```bash
node --import tsx --test lib/matching/score.test.ts
DATABASE_URL=postgresql://carsablanca:carsablanca@localhost:5432/carsablanca node --import tsx --test lib/matching/catalog.test.ts
npx tsc --noEmit --pretty false
npx eslint lib/matching/catalog.ts lib/matching/catalog.test.ts scripts/import-historical-catalog.ts
```

- [x] **Step 3: Browser verify the live matching page**

Open:

```text
http://localhost:3000/fr/trouver?budget=6500&condition=all&usage=mixed&annualKm=15000&body=suv&fuel=diesel&seats=5
```

Expected: multiple ranked SUV diesel matches, including historical official candidates and no mobile horizontal overflow.
