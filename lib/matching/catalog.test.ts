import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { loadEnvConfig } from "@next/env";

import { closeDb } from "@/lib/db";
import { getCatalogCandidates } from "./catalog";

loadEnvConfig(process.cwd());

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

function normalizeFamily(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

after(async () => {
  await closeDb();
});

describe(
  "getCatalogCandidates",
  { skip: hasDatabaseUrl ? false : "DATABASE_URL is not configured" },
  () => {
    it("loads priced Moroccan catalog versions for matching", async () => {
      const candidates = await getCatalogCandidates();

      assert.ok(candidates.length >= 50);
      assert.ok(candidates.every((candidate) => candidate.priceMad > 0));
      assert.ok(candidates.some((candidate) => candidate.brand === "Dacia"));
      assert.ok(candidates.some((candidate) => candidate.sourceNames.includes("Wandaloo")));
    });

    it("loads historical used and common-import candidates after the historical import", async () => {
      const candidates = await getCatalogCandidates();

      assert.ok(
        candidates.some(
          (candidate) =>
            candidate.brand === "Dacia" &&
            candidate.model === "Duster" &&
            candidate.modelYear !== null &&
            candidate.modelYear < 2020 &&
            candidate.availabilityScope === "used_ma",
        ),
      );
      assert.ok(
        candidates.some(
          (candidate) => candidate.availabilityScope === "imported_edge_case",
        ),
      );
    });

    it("loads broader 2000s Moroccan used-market families for matching", async () => {
      const candidates = await getCatalogCandidates();
      const families = new Set(
        candidates.map((candidate) =>
          normalizeFamily(`${candidate.brand}|${candidate.model}`),
        ),
      );
      const requiredFamilies = [
        "Chevrolet|Aveo",
        "Honda|Civic",
        "Mazda|3",
        "Mitsubishi|Pajero",
        "Renault|Scenic",
        "Skoda|Octavia",
        "Suzuki|Swift",
        "Volkswagen|Passat",
      ].map(normalizeFamily);

      for (const family of requiredFamilies) {
        assert.ok(families.has(family), `Expected historical catalog to include ${family}`);
      }

      assert.ok(
        candidates.some(
          (candidate) =>
            candidate.availabilityScope === "used_ma" &&
            candidate.modelYear !== null &&
            candidate.modelYear <= 2008 &&
            candidate.priceMad < 50_000,
        ),
        "Expected older sub-50k MAD used cars to remain matchable",
      );
      assert.ok(new Set(candidates.map((candidate) => candidate.brand)).size >= 30);
    });
  },
);
