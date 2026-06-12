import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createReliabilitySeedPlan,
  type ReliabilitySeedVehicle,
} from "./seed-plan";

const baseVehicle: ReliabilitySeedVehicle = {
  brandId: "brand-dacia",
  brand: "Dacia",
  modelId: "model-logan",
  model: "Logan",
  generationId: "generation-logan-2",
  generationName: "Logan II",
  generationCode: "logan-2",
  startsYear: 2013,
  endsYear: 2020,
  versionId: "version-logan-dci",
  powertrainId: null,
  commercialName: "1.5 dCi 90",
  trimName: "Laureate",
  bodyStyle: "sedan",
  marketCode: "MA",
  marketOrigin: "morocco_official",
  availabilityScope: "used_ma",
  fiscalHp: 6,
  seats: 5,
  sourceConfidence: 0.55,
  fuelType: null,
};

describe("createReliabilitySeedPlan", () => {
  it("covers every model, generation, and version in the catalog input", () => {
    const vehicles: ReliabilitySeedVehicle[] = [
      baseVehicle,
      {
        ...baseVehicle,
        versionId: "version-logan-tce",
        commercialName: "0.9 TCe 90",
        trimName: "Ambiance",
      },
      {
        ...baseVehicle,
        brandId: "brand-toyota",
        brand: "Toyota",
        modelId: "model-corolla",
        model: "Corolla",
        generationId: "generation-corolla-e170",
        generationName: "Corolla E170",
        generationCode: "e170",
        startsYear: 2014,
        endsYear: 2019,
        versionId: "version-corolla-hybrid",
        commercialName: "1.8 Hybrid",
        trimName: "Business",
        bodyStyle: "sedan",
      },
    ];

    const plan = createReliabilitySeedPlan(vehicles);

    assert.equal(plan.summary.modelCount, 2);
    assert.equal(plan.summary.generationCount, 2);
    assert.equal(plan.summary.versionCount, 3);

    const modelProfileIssues = plan.issues.filter((issue) => issue.kind === "model_profile");
    assert.deepEqual(
      modelProfileIssues.map((issue) => issue.scope.modelId).sort(),
      ["model-corolla", "model-logan"],
    );

    const generationProfileIssues = plan.issues.filter(
      (issue) => issue.kind === "generation_profile",
    );
    assert.deepEqual(
      generationProfileIssues.map((issue) => issue.scope.generationId).sort(),
      ["generation-corolla-e170", "generation-logan-2"],
    );

    const applicableGenerationIds = new Set(
      plan.applicability
        .map((item) => item.generationId)
        .filter((value): value is string => Boolean(value)),
    );
    assert.deepEqual([...applicableGenerationIds].sort(), [
      "generation-corolla-e170",
      "generation-logan-2",
    ]);

    const scheduledVersionIds = new Set(
      plan.maintenanceSchedules.map((schedule) => schedule.vehicleVersionId),
    );
    assert.deepEqual([...scheduledVersionIds].sort(), [
      "version-corolla-hybrid",
      "version-logan-dci",
      "version-logan-tce",
    ]);
  });

  it("adds targeted baseline quirks from fuel, age, market, brand tier, and confidence", () => {
    const plan = createReliabilitySeedPlan([
      {
        ...baseVehicle,
        brandId: "brand-bmw",
        brand: "BMW",
        modelId: "model-x5",
        model: "X5",
        generationId: "generation-x5-e70",
        generationName: "X5 E70 import",
        generationCode: "x5-e70-import",
        startsYear: 2007,
        endsYear: 2013,
        versionId: "version-x5-tdi",
        commercialName: "3.0 TDI",
        trimName: "Luxury",
        bodyStyle: "suv",
        marketCode: "EU",
        marketOrigin: "morocco_used_import",
        availabilityScope: "imported_edge_case",
        fiscalHp: 12,
        sourceConfidence: 0.32,
      },
    ]);

    const keys = new Set(plan.issues.map((issue) => issue.templateKey));

    assert.ok(keys.has("diesel-injection-emissions"));
    assert.ok(keys.has("older-generation-wear"));
    assert.ok(keys.has("import-provenance-parts"));
    assert.ok(keys.has("premium-electronics-suspension"));
    assert.ok(keys.has("suv-suspension-tire-wear"));
    assert.ok(keys.has("low-source-confidence"));
  });

  it("keeps generated issue slugs deterministic and bounded for the schema", () => {
    const first = createReliabilitySeedPlan([baseVehicle]);
    const second = createReliabilitySeedPlan([baseVehicle]);

    assert.deepEqual(
      first.issues.map((issue) => issue.slug),
      second.issues.map((issue) => issue.slug),
    );
    assert.ok(first.issues.every((issue) => issue.slug.length <= 220));
    assert.ok(
      first.issues.every((issue) =>
        issue.slug.startsWith("carsablanca-reliability-baseline-"),
      ),
    );
  });
});
