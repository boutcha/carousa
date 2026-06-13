import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createNhtsaRecallImportPlan,
  parseNhtsaRecallLine,
  type NhtsaCatalogGeneration,
} from "./nhtsa-recalls";

const catalog: NhtsaCatalogGeneration[] = [
  {
    brandId: "brand-toyota",
    brandName: "Toyota",
    modelId: "model-corolla",
    modelName: "Corolla",
    generationId: "generation-corolla-e210",
    generationName: "Corolla E210",
    startsYear: 2019,
    endsYear: null,
  },
  {
    brandId: "brand-volkswagen",
    brandName: "Volkswagen",
    modelId: "model-golf",
    modelName: "Golf",
    generationId: "generation-golf-7",
    generationName: "Golf VII",
    startsYear: 2013,
    endsYear: 2020,
  },
  {
    brandId: "brand-mazda",
    brandName: "Mazda",
    modelId: "model-mazda-3",
    modelName: "3",
    generationId: "generation-mazda-3-bp",
    generationName: "Mazda 3 BP",
    startsYear: 2019,
    endsYear: null,
  },
];

function recallLine(overrides: Partial<Record<number, string>> = {}) {
  const fields = Array.from({ length: 29 }, () => "");
  fields[0] = "100001";
  fields[1] = "24V123000";
  fields[2] = "TOYOTA";
  fields[3] = "COROLLA";
  fields[4] = "2021";
  fields[6] = "SERVICE BRAKES, HYDRAULIC";
  fields[7] = "Toyota Motor Engineering & Manufacturing";
  fields[10] = "V";
  fields[11] = "12000";
  fields[13] = "MFR";
  fields[15] = "20240215";
  fields[19] =
    "Toyota is recalling certain vehicles. A brake actuator may fail and reduce braking assist.";
  fields[20] = "Reduced braking assist can increase the risk of a crash.";
  fields[21] =
    "Dealers will inspect and replace the brake actuator free of charge. Owners may contact NHTSA at <A HREF=HTTP://WWW.SAFERCAR.GOV>HTTP://WWW.SAFERCAR.GOV</A>.";
  fields[22] = "Owners should use the VIN lookup to confirm applicability.";
  fields[27] = "No";
  fields[28] = "No";

  for (const [index, value] of Object.entries(overrides)) {
    if (value !== undefined) fields[Number(index)] = value;
  }

  return fields.join("\t");
}

describe("parseNhtsaRecallLine", () => {
  it("parses official 29-field tab-delimited recall rows and cleans HTML", () => {
    const parsed = parseNhtsaRecallLine(recallLine());

    assert.equal(parsed?.campaignNumber, "24V123000");
    assert.equal(parsed?.make, "TOYOTA");
    assert.equal(parsed?.model, "COROLLA");
    assert.equal(parsed?.modelYear, 2021);
    assert.equal(parsed?.recallTypeCode, "V");
    assert.equal(parsed?.correctiveAction.includes("<A HREF"), false);
    assert.equal(parsed?.correctiveAction.includes("SAFERCAR.GOV"), true);
  });

  it("ignores malformed, non-vehicle, and unknown-year rows", () => {
    assert.equal(parseNhtsaRecallLine("too\tshort"), null);
    assert.equal(parseNhtsaRecallLine(recallLine({ 10: "E" })), null);
    assert.equal(parseNhtsaRecallLine(recallLine({ 4: "9999" })), null);
  });
});

describe("createNhtsaRecallImportPlan", () => {
  it("creates one official issue per campaign and dedupes applicability rows", () => {
    const plan = createNhtsaRecallImportPlan(catalog, [
      parseNhtsaRecallLine(recallLine())!,
      parseNhtsaRecallLine(recallLine({ 0: "100002" }))!,
    ]);

    assert.equal(plan.summary.totalRecords, 2);
    assert.equal(plan.summary.vehicleRecords, 2);
    assert.equal(plan.summary.matchedRecords, 2);
    assert.equal(plan.issues.length, 1);
    assert.equal(plan.applicability.length, 1);
    assert.equal(plan.issues[0].slug, "nhtsa-recall-24v123000");
    assert.equal(plan.issues[0].affectedSystem, "brakes");
    assert.equal(plan.issues[0].severity, "high");
    assert.equal(plan.applicability[0].generationId, "generation-corolla-e210");
    assert.equal(plan.applicability[0].modelYearStart, 2021);
    assert.match(plan.applicability[0].notes, /US-market recall/);
  });

  it("matches common make aliases and model names conservatively", () => {
    const plan = createNhtsaRecallImportPlan(catalog, [
      parseNhtsaRecallLine(
        recallLine({
          1: "23V456000",
          2: "VW",
          3: "GOLF GTI",
          4: "2018",
          6: "ELECTRICAL SYSTEM",
        }),
      )!,
      parseNhtsaRecallLine(
        recallLine({
          1: "23V789000",
          2: "MAZDA",
          3: "CX-3",
          4: "2022",
        }),
      )!,
    ]);

    assert.equal(plan.summary.matchedRecords, 1);
    assert.equal(plan.applicability[0].generationId, "generation-golf-7");
    assert.equal(plan.unmatchedRecords[0].make, "MAZDA");
    assert.equal(plan.unmatchedRecords[0].model, "CX-3");
  });

  it("marks do-not-drive and park-outside recalls as critical", () => {
    const plan = createNhtsaRecallImportPlan(catalog, [
      parseNhtsaRecallLine(recallLine({ 1: "25V111000", 27: "Yes", 28: "Yes" }))!,
    ]);

    assert.equal(plan.issues[0].severity, "critical");
    assert.match(plan.issues[0].description, /Do not drive/);
    assert.match(plan.issues[0].description, /Park outside/);
  });
});
