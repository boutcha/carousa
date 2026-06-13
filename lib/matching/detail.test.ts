import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createVehicleDetailAssessment,
  parseCatalogCandidateId,
  type VehicleDetailIssue,
} from "./detail";
import {
  estimateMonthlyCost,
  parseMatchCriteria,
  type CatalogCandidate,
} from "./score";

const baseCandidate: CatalogCandidate = {
  id: "version-123:po:price-456",
  brand: "Dacia",
  model: "Duster",
  commercialName: "1.5 dCi 115",
  trimName: "Prestige",
  bodyStyle: "suv",
  availabilityScope: "used_ma",
  marketOrigin: "morocco_official",
  fiscalHp: 6,
  seats: 5,
  modelYear: 2019,
  priceMad: 165000,
  sourceNames: ["Moteur"],
  officialRecallCount: 0,
  highSeverityRecallCount: 0,
  criticalRecallCount: 0,
};

const seriousIssues: VehicleDetailIssue[] = [
  {
    title: "NHTSA recall 24V123000: SERVICE BRAKES",
    severity: "critical",
    affectedSystem: "brakes",
    confidence: 0.95,
    sourceName: "NHTSA vehicle recalls bulk data",
    notes: "Matched from official NHTSA recall.",
  },
  {
    title: "NHTSA recall 23V456000: ELECTRICAL SYSTEM",
    severity: "high",
    affectedSystem: "electrical",
    confidence: 0.95,
    sourceName: "NHTSA vehicle recalls bulk data",
    notes: "Matched from official NHTSA recall.",
  },
];

describe("parseCatalogCandidateId", () => {
  it("extracts the vehicle version and source record from synthetic catalog ids", () => {
    assert.deepEqual(parseCatalogCandidateId("version-123:po:price-456"), {
      vehicleVersionId: "version-123",
      sourceKind: "po",
      sourceRecordId: "price-456",
    });
    assert.deepEqual(parseCatalogCandidateId("version-123:vy:year-789"), {
      vehicleVersionId: "version-123",
      sourceKind: "vy",
      sourceRecordId: "year-789",
    });
    assert.equal(parseCatalogCandidateId("bad-id"), null);
  });
});

describe("createVehicleDetailAssessment", () => {
  it("summarizes practical pros for a sourced family fit", () => {
    const criteria = parseMatchCriteria({
      mode: "credit",
      monthlyBudget: "6500",
      priorities: "family_space,reliability",
      minSeats: "5",
    });
    const estimate = estimateMonthlyCost(baseCandidate, criteria);
    const assessment = createVehicleDetailAssessment({
      candidate: baseCandidate,
      criteria,
      estimate,
      issues: [],
      maintenanceScheduleCount: 4,
    });

    assert.ok(assessment.pros.some((item) => item.key === "family_space"));
    assert.ok(assessment.pros.some((item) => item.key === "official_price_source"));
    assert.ok(assessment.pros.some((item) => item.key === "clean_recall_record"));
    assert.equal(assessment.riskLevel, "low");
  });

  it("surfaces recall and budget pressure as cons", () => {
    const candidate: CatalogCandidate = {
      ...baseCandidate,
      officialRecallCount: 4,
      highSeverityRecallCount: 3,
      criticalRecallCount: 1,
      priceMad: 260000,
    };
    const criteria = parseMatchCriteria({
      mode: "credit",
      monthlyBudget: "4500",
      priorities: "safety,reliability",
    });
    const estimate = estimateMonthlyCost(candidate, criteria);
    const assessment = createVehicleDetailAssessment({
      candidate,
      criteria,
      estimate,
      issues: seriousIssues,
      maintenanceScheduleCount: 1,
    });

    assert.equal(assessment.riskLevel, "high");
    assert.ok(assessment.cons.some((item) => item.key === "official_recall_attention"));
    assert.ok(assessment.cons.some((item) => item.key === "over_monthly_budget"));
    assert.ok(assessment.facts.some((item) => item.key === "official_recalls"));
  });
});
