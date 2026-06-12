import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  estimateMonthlyCost,
  parseMatchCriteria,
  rankCandidates,
  type CatalogCandidate,
  type MatchCriteria,
} from "./score";

const baseCandidate: CatalogCandidate = {
  id: "version-1",
  brand: "Dacia",
  model: "Sandero Streetway",
  commercialName: "1.5 dCi 95",
  trimName: "Essentiel",
  bodyStyle: "hatchback",
  availabilityScope: "new_ma",
  marketOrigin: "morocco_official",
  fiscalHp: 6,
  seats: null,
  modelYear: 2026,
  priceMad: 169900,
  sourceNames: ["Wandaloo", "Moteur"],
};

const baseCriteria: MatchCriteria = {
  mode: "unsure",
  cashBudgetMad: null,
  monthlyBudgetMad: null,
  downPaymentMad: 0,
  durationMonths: 60,
  budgetMad: null,
  usage: "mixed",
  seats: "any",
  minSeats: "any",
  body: "any",
  fuel: "any",
  annualKm: 15000,
  familySize: null,
  trunkNeed: "medium",
  parkingNeed: "medium",
  priorities: [],
  condition: "all",
};

describe("parseMatchCriteria", () => {
  it("normalizes URL criteria and keeps safe defaults", () => {
    const criteria = parseMatchCriteria({
      budget: "5 000 DH",
      usage: "road",
      seats: "5",
      body: "suv",
      fuel: "diesel",
      annualKm: "25000",
      condition: "new",
    });

    assert.equal(criteria.budgetMad, 5000);
    assert.equal(criteria.usage, "long_distance");
    assert.equal(criteria.seats, "5");
    assert.equal(criteria.body, "suv");
    assert.equal(criteria.fuel, "diesel");
    assert.equal(criteria.annualKm, 25000);
    assert.equal(criteria.condition, "new");
  });

  it("parses payment scenario, space needs, and capped priorities", () => {
    const criteria = parseMatchCriteria({
      mode: "mourabaha",
      monthlyBudget: "6 500 DH",
      downPayment: "45 000",
      durationMonths: "72",
      usage: "long_distance",
      annualKm: "30000",
      minSeats: "5",
      familySize: "4",
      trunkNeed: "high",
      parkingNeed: "low",
      priorities: "reliability,family_space,cheap_maintenance,premium_feel",
    });

    assert.equal(criteria.mode, "mourabaha");
    assert.equal(criteria.monthlyBudgetMad, 6500);
    assert.equal(criteria.downPaymentMad, 45000);
    assert.equal(criteria.durationMonths, 72);
    assert.equal(criteria.usage, "long_distance");
    assert.equal(criteria.annualKm, 30000);
    assert.equal(criteria.minSeats, "5");
    assert.equal(criteria.familySize, 4);
    assert.equal(criteria.trunkNeed, "high");
    assert.equal(criteria.parkingNeed, "low");
    assert.deepEqual(criteria.priorities, [
      "reliability",
      "family_space",
      "cheap_maintenance",
    ]);
    assert.equal(criteria.condition, "all");
  });

  it("maps legacy find-page params into the new scenario model", () => {
    const criteria = parseMatchCriteria({
      budget: "5 000",
      usage: "road",
      seats: "7",
      body: "suv",
      fuel: "diesel",
      condition: "used",
    });

    assert.equal(criteria.mode, "credit");
    assert.equal(criteria.monthlyBudgetMad, 5000);
    assert.equal(criteria.budgetMad, 5000);
    assert.equal(criteria.usage, "long_distance");
    assert.equal(criteria.minSeats, "7");
    assert.equal(criteria.seats, "7");
    assert.equal(criteria.body, "suv");
    assert.equal(criteria.fuel, "diesel");
    assert.equal(criteria.condition, "used");
  });
});

describe("estimateMonthlyCost", () => {
  it("breaks a Moroccan new-car price into monthly ownership buckets", () => {
    const estimate = estimateMonthlyCost(baseCandidate, {
      ...baseCriteria,
      budgetMad: 5000,
      usage: "mixed",
      seats: "any",
      minSeats: "any",
      body: "any",
      fuel: "any",
      annualKm: 15000,
      condition: "all",
    });

    assert.deepEqual(estimate, {
      financingMad: 2350,
      insuranceMad: 330,
      fuelMad: 735,
      maintenanceMad: 250,
      feesMad: 75,
      depreciationMad: 1133,
      totalMad: 4873,
    });
  });
});

describe("rankCandidates", () => {
  it("prefers a criteria match over a cheaper poor-fit car and drops far over-budget cars", () => {
    const ranked = rankCandidates(
      [
        { ...baseCandidate, id: "hatch", model: "Sandero", priceMad: 132000 },
        {
          ...baseCandidate,
          id: "suv",
          brand: "Dacia",
          model: "Duster",
          bodyStyle: "suv",
          commercialName: "1.5 dCi 115",
          priceMad: 190000,
        },
        {
          ...baseCandidate,
          id: "luxury",
          brand: "BMW",
          model: "X3",
          bodyStyle: "suv",
          priceMad: 650000,
        },
      ],
      {
        ...baseCriteria,
        budgetMad: 6200,
        usage: "mixed",
        seats: "5",
        minSeats: "5",
        body: "suv",
        fuel: "diesel",
        annualKm: 15000,
        condition: "all",
      },
    );

    assert.equal(ranked[0]?.candidate.id, "suv");
    assert.equal(ranked.some((match) => match.candidate.id === "luxury"), false);
    assert.ok(ranked[0]?.reasons.includes("SUV"));
    assert.ok(ranked[0]?.reasons.includes("Diesel"));
  });

  it("treats explicit body and fuel choices as hard filters", () => {
    const ranked = rankCandidates(
      [
        { ...baseCandidate, id: "hatch", model: "Sandero", priceMad: 132000 },
        {
          ...baseCandidate,
          id: "gasoline-suv",
          model: "GX3 Pro",
          bodyStyle: "suv",
          commercialName: "1.5 l 103",
          priceMad: 142400,
        },
        {
          ...baseCandidate,
          id: "diesel-suv",
          model: "Duster",
          bodyStyle: "suv",
          commercialName: "1.5 dCi 115",
          priceMad: 190000,
        },
      ],
      {
        ...baseCriteria,
        budgetMad: 7000,
        usage: "mixed",
        seats: "any",
        minSeats: "any",
        body: "suv",
        fuel: "diesel",
        annualKm: 15000,
        condition: "all",
      },
    );

    assert.deepEqual(
      ranked.map((match) => match.candidate.id),
      ["diesel-suv"],
    );
  });

  it("prefers a newer affordable fit over a much older cheap fit", () => {
    const ranked = rankCandidates(
      [
        {
          ...baseCandidate,
          id: "old-cheap",
          availabilityScope: "used_ma",
          model: "Santa Fe",
          bodyStyle: "suv",
          commercialName: "2.0 CRDi",
          trimName: "Pack",
          modelYear: 2001,
          priceMad: 45000,
        },
        {
          ...baseCandidate,
          id: "newer-affordable",
          availabilityScope: "used_ma",
          model: "Duster",
          bodyStyle: "suv",
          commercialName: "1.5 dCi 110",
          trimName: "Laureate",
          modelYear: 2017,
          priceMad: 125000,
        },
      ],
      {
        ...baseCriteria,
        budgetMad: 6500,
        usage: "mixed",
        seats: "5",
        minSeats: "5",
        body: "suv",
        fuel: "diesel",
        annualKm: 15000,
        condition: "all",
      },
    );

    assert.equal(ranked[0]?.candidate.id, "newer-affordable");
  });

  it("diversifies ranked results by model family before filling the limit", () => {
    const ranked = rankCandidates(
      [
        {
          ...baseCandidate,
          id: "ecosport-2016",
          availabilityScope: "used_ma",
          brand: "Ford",
          model: "EcoSport",
          bodyStyle: "suv",
          commercialName: "1.5 TDCi",
          trimName: "Trend",
          modelYear: 2016,
          priceMad: 103500,
        },
        {
          ...baseCandidate,
          id: "ecosport-2017",
          availabilityScope: "used_ma",
          brand: "Ford",
          model: "EcoSport",
          bodyStyle: "suv",
          commercialName: "1.5 TDCi",
          trimName: "Trend",
          modelYear: 2017,
          priceMad: 113000,
        },
        {
          ...baseCandidate,
          id: "captur-2016",
          availabilityScope: "used_ma",
          brand: "Renault",
          model: "Captur",
          bodyStyle: "suv",
          commercialName: "1.5 dCi 90",
          trimName: "Intens",
          modelYear: 2016,
          priceMad: 129000,
        },
      ],
      {
        ...baseCriteria,
        budgetMad: 6500,
        usage: "mixed",
        seats: "5",
        minSeats: "5",
        body: "suv",
        fuel: "diesel",
        annualKm: 15000,
        condition: "all",
      },
      2,
    );

    assert.deepEqual(
      ranked.map((match) => `${match.candidate.brand}|${match.candidate.model}`),
      ["Ford|EcoSport", "Renault|Captur"],
    );
  });
});
