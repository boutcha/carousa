# Mobile Scenario Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first `/[locale]/trouver` advisor that starts with buying mode, captures usage/space/priorities, ranks new/used/import candidates automatically, and lets users adjust scenarios from results.

**Architecture:** Keep the route as a Next App Router Server Component that awaits `params` and `searchParams`, loads catalog data server-side, and passes normalized criteria into focused UI components. Extend `lib/matching/score.ts` first so the UI is a thin query-param form over deterministic parsing, financing, and ranking behavior.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Node built-in test runner via `tsx --test`, Drizzle-backed catalog query.

---

## Context Notes

- `app/[locale]/trouver/page.tsx` is currently a Server Component and already uses the Next 16 `params: Promise<...>` and `searchParams: Promise<...>` page API.
- Next docs checked before planning:
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/02-guides/forms.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`
- Prefer reading `searchParams` in the Server Component and passing plain props to client components. If a client component reads `useSearchParams`, wrap it in Suspense or avoid it. This plan avoids `useSearchParams`.
- There are existing dirty files in the workspace. Commit only files changed by the current task slice.

## File Structure

- Modify `lib/matching/score.ts`
  - Owns URL criteria parsing, buying-mode types, affordability fields, priority values, monthly estimates, and ranking.
- Modify `lib/matching/score.test.ts`
  - Owns regression tests for legacy params, new scenario params, priority capping, payment-mode estimates, and automatic condition handling.
- Create `components/matching/mobile-advisor-form.tsx`
  - Client Component for the mobile stepper intake. It owns local step navigation only; final submission is a GET form to the same route.
- Create `components/matching/results-workbench.tsx`
  - Mostly presentational component for sticky scenario summary, scenario quick links, adjustment sheet form, and result cards.
- Modify `app/[locale]/trouver/page.tsx`
  - Keeps data loading and ranking server-side; delegates intake and results UI to the new components.
- Modify `lib/i18n/dictionaries/fr.json`, `lib/i18n/dictionaries/en.json`, `lib/i18n/dictionaries/ar.json`
  - Adds matching copy for buying mode, scenario fields, priorities, result labels, and workbench actions.

---

### Task 1: Scenario Criteria Parser

**Files:**
- Modify: `lib/matching/score.test.ts`
- Modify: `lib/matching/score.ts`

- [ ] **Step 1: Add failing parser tests**

Add these imports and tests to `lib/matching/score.test.ts`, keeping the existing tests:

```ts
import {
  estimateMonthlyCost,
  parseMatchCriteria,
  rankCandidates,
  type CatalogCandidate,
} from "./score";
```

Add this test inside `describe("parseMatchCriteria", () => { ... })`:

```ts
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
```

- [ ] **Step 2: Run parser tests and verify failure**

Run:

```bash
npx tsx --test lib/matching/score.test.ts
```

Expected: FAIL with TypeScript errors or assertion failures for missing fields such as `mode`, `monthlyBudgetMad`, `downPaymentMad`, `durationMonths`, `minSeats`, `familySize`, `trunkNeed`, `parkingNeed`, and `priorities`.

- [ ] **Step 3: Extend criteria types and parsing**

In `lib/matching/score.ts`, replace the existing usage, seats, and criteria type block with:

```ts
export type MatchUsage = "town" | "mixed" | "long_distance";
export type LegacyMatchUsage = "city" | "mixed" | "road";
export type MatchSeats = "any" | "2" | "5" | "7";
export type MatchCondition = "all" | "new" | "used";
export type BuyingMode = "cash" | "credit" | "mourabaha" | "unsure";
export type NeedLevel = "low" | "medium" | "high";
export type MatchPriority =
  | "lowest_monthly"
  | "reliability"
  | "cheap_maintenance"
  | "fuel_economy"
  | "family_space"
  | "long_distance_comfort"
  | "safety"
  | "resale_value"
  | "premium_feel"
  | "easy_city_parking";

export type MatchCriteria = {
  mode: BuyingMode;
  cashBudgetMad: number | null;
  monthlyBudgetMad: number | null;
  downPaymentMad: number;
  durationMonths: number;
  budgetMad: number | null;
  usage: MatchUsage;
  seats: MatchSeats;
  minSeats: MatchSeats;
  body: MatchBody;
  fuel: MatchFuel;
  annualKm: number;
  familySize: number | null;
  trunkNeed: NeedLevel;
  parkingNeed: NeedLevel;
  priorities: MatchPriority[];
  condition: MatchCondition;
};
```

Then replace the option sets and `parseMatchCriteria` helper section with:

```ts
const fuelValues = new Set<MatchFuel>(["any", "gasoline", "diesel", "hybrid", "electric"]);
const usageValues = new Set<MatchUsage>(["town", "mixed", "long_distance"]);
const legacyUsageValues = new Set<LegacyMatchUsage>(["city", "mixed", "road"]);
const seatValues = new Set<MatchSeats>(["any", "2", "5", "7"]);
const conditionValues = new Set<MatchCondition>(["all", "new", "used"]);
const buyingModeValues = new Set<BuyingMode>(["cash", "credit", "mourabaha", "unsure"]);
const needLevelValues = new Set<NeedLevel>(["low", "medium", "high"]);
const priorityValues = new Set<MatchPriority>([
  "lowest_monthly",
  "reliability",
  "cheap_maintenance",
  "fuel_economy",
  "family_space",
  "long_distance_comfort",
  "safety",
  "resale_value",
  "premium_feel",
  "easy_city_parking",
]);

function normalizeUsage(value: SearchParamValue): MatchUsage {
  const raw = firstValue(value);
  if (raw && usageValues.has(raw as MatchUsage)) return raw as MatchUsage;
  if (raw && legacyUsageValues.has(raw as LegacyMatchUsage)) {
    if (raw === "city") return "town";
    if (raw === "road") return "long_distance";
    return "mixed";
  }
  return "mixed";
}

function parseDuration(value: SearchParamValue) {
  const parsed = parsePositiveInteger(value);
  if (!parsed) return 60;
  return Math.min(Math.max(parsed, 24), 84);
}

function parseFamilySize(value: SearchParamValue) {
  const parsed = parsePositiveInteger(value);
  return parsed ? Math.min(Math.max(parsed, 1), 9) : null;
}

function parsePriorities(value: SearchParamValue): MatchPriority[] {
  const raw = firstValue(value);
  if (!raw) return [];

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is MatchPriority => priorityValues.has(item as MatchPriority))
    .slice(0, 3);
}

export function parseMatchCriteria(input: SearchParamInput): MatchCriteria {
  const annualKm = parsePositiveInteger(input.annualKm);
  const legacyBudget = parsePositiveInteger(input.budget);
  const monthlyBudget = parsePositiveInteger(input.monthlyBudget) ?? legacyBudget;
  const cashBudget = parsePositiveInteger(input.cashBudget);
  const mode = pickOption(input.mode, buyingModeValues, legacyBudget ? "credit" : "unsure");
  const minSeats = pickOption(input.minSeats ?? input.seats, seatValues, "any");
  const usage = normalizeUsage(input.usage);
  const defaultAnnualKm =
    usage === "town" ? 10000 : usage === "long_distance" ? 25000 : 15000;

  return {
    mode,
    cashBudgetMad: cashBudget,
    monthlyBudgetMad: monthlyBudget,
    downPaymentMad: parsePositiveInteger(input.downPayment) ?? 0,
    durationMonths: parseDuration(input.durationMonths),
    budgetMad: monthlyBudget,
    usage,
    seats: minSeats,
    minSeats,
    body: pickOption(input.body, bodyValues, "any"),
    fuel: pickOption(input.fuel, fuelValues, "any"),
    annualKm: annualKm ? Math.min(Math.max(annualKm, 5000), 40000) : defaultAnnualKm,
    familySize: parseFamilySize(input.familySize),
    trunkNeed: pickOption(input.trunkNeed, needLevelValues, "medium"),
    parkingNeed: pickOption(input.parkingNeed, needLevelValues, "medium"),
    priorities: parsePriorities(input.priorities),
    condition: pickOption(input.condition, conditionValues, "all"),
  };
}
```

- [ ] **Step 4: Update usage checks in fuel estimation**

In `estimateFuelMonthly`, replace the usage factor line with:

```ts
  const usageFactor =
    criteria.usage === "town" ? 1.14 : criteria.usage === "long_distance" ? 0.88 : 1;
```

- [ ] **Step 5: Run parser tests and verify pass**

Run:

```bash
npx tsx --test lib/matching/score.test.ts
```

Expected: PASS with 8 tests.

- [ ] **Step 6: Commit parser slice**

Run:

```bash
git add lib/matching/score.ts lib/matching/score.test.ts
git commit -m "feat: parse mobile buyer scenarios"
```

---

### Task 2: Payment-Aware Estimates And Automatic Market Handling

**Files:**
- Modify: `lib/matching/score.test.ts`
- Modify: `lib/matching/score.ts`

- [ ] **Step 1: Add failing payment-mode tests**

Add these tests inside `describe("estimateMonthlyCost", () => { ... })`:

```ts
  it("does not add financing payment for cash mode", () => {
    const estimate = estimateMonthlyCost(baseCandidate, {
      ...parseMatchCriteria({ mode: "cash", cashBudget: "180000" }),
      annualKm: 15000,
    });

    assert.equal(estimate.financingMad, 0);
    assert.ok(estimate.totalMad < 3000);
  });

  it("uses down payment and duration for credit mode", () => {
    const shorter = estimateMonthlyCost(baseCandidate, {
      ...parseMatchCriteria({
        mode: "credit",
        monthlyBudget: "6500",
        downPayment: "40000",
        durationMonths: "48",
      }),
      annualKm: 15000,
    });
    const longer = estimateMonthlyCost(baseCandidate, {
      ...parseMatchCriteria({
        mode: "credit",
        monthlyBudget: "6500",
        downPayment: "40000",
        durationMonths: "72",
      }),
      annualKm: 15000,
    });

    assert.ok(shorter.financingMad > longer.financingMad);
    assert.ok(longer.financingMad > 0);
  });

  it("uses a margin model for mourabaha mode", () => {
    const estimate = estimateMonthlyCost(baseCandidate, {
      ...parseMatchCriteria({
        mode: "mourabaha",
        monthlyBudget: "6500",
        downPayment: "40000",
        durationMonths: "60",
      }),
      annualKm: 15000,
    });

    assert.ok(estimate.financingMad > 0);
    assert.ok(estimate.totalMad > estimate.financingMad);
  });
```

Add this test inside `describe("rankCandidates", () => { ... })`:

```ts
  it("keeps new, used, and import candidates available by default", () => {
    const ranked = rankCandidates(
      [
        { ...baseCandidate, id: "new", availabilityScope: "new_ma", priceMad: 170000 },
        {
          ...baseCandidate,
          id: "used",
          availabilityScope: "used_ma",
          marketOrigin: "morocco_official",
          modelYear: 2018,
          priceMad: 105000,
        },
        {
          ...baseCandidate,
          id: "import",
          availabilityScope: "imported_edge_case",
          marketOrigin: "morocco_used_import",
          modelYear: 2016,
          priceMad: 95000,
        },
      ],
      parseMatchCriteria({ mode: "credit", monthlyBudget: "6500" }),
      3,
    );

    assert.deepEqual(
      ranked.map((match) => match.candidate.id).sort(),
      ["import", "new", "used"],
    );
  });
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npx tsx --test lib/matching/score.test.ts
```

Expected: FAIL because `estimateMonthlyCost` still uses the old fixed financing assumptions and legacy `usage` test data still references `"mixed"` safely but lacks the new fields in literal objects.

- [ ] **Step 3: Add payment helper functions**

In `lib/matching/score.ts`, add these helpers above `estimateMonthlyCost`:

```ts
function amortizedMonthlyPayment(principal: number, annualRate: number, months: number) {
  if (principal <= 0) return 0;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return Math.round(principal / months);

  return Math.round(
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)),
  );
}

function estimateFinancingMonthly(candidate: CatalogCandidate, criteria: MatchCriteria) {
  const principal = Math.max(candidate.priceMad - criteria.downPaymentMad, 0);

  if (criteria.mode === "cash") return 0;
  if (criteria.mode === "mourabaha") {
    const margin = isNewCandidate(candidate) ? 0.16 : 0.2;
    return Math.round((principal * (1 + margin)) / criteria.durationMonths);
  }
  if (criteria.mode === "unsure") {
    const credit = amortizedMonthlyPayment(principal, isNewCandidate(candidate) ? 0.082 : 0.095, criteria.durationMonths);
    const mourabaha = Math.round((principal * 1.18) / criteria.durationMonths);
    return Math.min(credit, mourabaha);
  }

  return amortizedMonthlyPayment(principal, isNewCandidate(candidate) ? 0.082 : 0.095, criteria.durationMonths);
}
```

- [ ] **Step 4: Replace fixed financing in monthly estimate**

In `estimateMonthlyCost`, replace these lines:

```ts
  const financedShare = isNew ? 0.7 : 0.65;
  const financeFactor = isNew ? 1.1856 : 1.22;
  const financeMonths = isNew ? 60 : 48;
  const financingMad = Math.round((price * financedShare * financeFactor) / financeMonths);
```

with:

```ts
  const financingMad = estimateFinancingMonthly(candidate, criteria);
```

- [ ] **Step 5: Update literal criteria objects in existing tests**

In `lib/matching/score.test.ts`, replace every literal criteria object with `parseMatchCriteria(...)` plus overrides. Example replacement:

```ts
const estimate = estimateMonthlyCost(baseCandidate, {
  ...parseMatchCriteria({
    mode: "credit",
    monthlyBudget: "5000",
    usage: "mixed",
  }),
  annualKm: 15000,
});
```

For rank tests, use:

```ts
parseMatchCriteria({
  monthlyBudget: "6200",
  usage: "mixed",
  minSeats: "5",
  body: "suv",
  fuel: "diesel",
})
```

- [ ] **Step 6: Update expected monthly estimate for the existing base case**

In the existing `breaks a Moroccan new-car price into monthly ownership buckets` test, replace the previous expected object with:

```ts
    assert.deepEqual(estimate, {
      financingMad: 3461,
      insuranceMad: 330,
      fuelMad: 1188,
      maintenanceMad: 250,
      feesMad: 75,
      depreciationMad: 1133,
      totalMad: 6437,
    });
```

- [ ] **Step 7: Run full scoring tests**

Run:

```bash
npx tsx --test lib/matching/score.test.ts
```

Expected: PASS with payment-mode and automatic market coverage tests included.

- [ ] **Step 8: Commit payment slice**

Run:

```bash
git add lib/matching/score.ts lib/matching/score.test.ts
git commit -m "feat: estimate buyer payment scenarios"
```

---

### Task 3: Priority-Aware Ranking

**Files:**
- Modify: `lib/matching/score.test.ts`
- Modify: `lib/matching/score.ts`

- [ ] **Step 1: Add failing priority ranking tests**

Add these tests inside `describe("rankCandidates", () => { ... })`:

```ts
  it("uses family-space priority to favor larger practical cars", () => {
    const ranked = rankCandidates(
      [
        { ...baseCandidate, id: "city", model: "Sandero", bodyStyle: "hatchback", priceMad: 120000 },
        { ...baseCandidate, id: "family", model: "Duster", bodyStyle: "suv", seats: 5, priceMad: 150000 },
      ],
      parseMatchCriteria({
        mode: "credit",
        monthlyBudget: "6500",
        priorities: "family_space",
        trunkNeed: "high",
        familySize: "4",
      }),
      2,
    );

    assert.equal(ranked[0]?.candidate.id, "family");
    assert.ok(ranked[0]?.reasons.includes("Espace familial"));
  });

  it("uses easy-city-parking priority to favor smaller cars", () => {
    const ranked = rankCandidates(
      [
        { ...baseCandidate, id: "small", model: "Sandero", bodyStyle: "hatchback", priceMad: 125000 },
        { ...baseCandidate, id: "large", model: "Duster", bodyStyle: "suv", priceMad: 125000 },
      ],
      parseMatchCriteria({
        mode: "credit",
        monthlyBudget: "6500",
        priorities: "easy_city_parking",
        parkingNeed: "high",
      }),
      2,
    );

    assert.equal(ranked[0]?.candidate.id, "small");
    assert.ok(ranked[0]?.reasons.includes("Facile en ville"));
  });
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npx tsx --test lib/matching/score.test.ts
```

Expected: FAIL because priorities do not affect score or reasons.

- [ ] **Step 3: Add priority scoring helper**

In `lib/matching/score.ts`, add this helper above `rankCandidates`:

```ts
function priorityScore(
  candidate: CatalogCandidate,
  estimate: MonthlyEstimate,
  inferredFuel: Exclude<MatchFuel, "any">,
  criteria: MatchCriteria,
) {
  let points = 0;
  const reasons: string[] = [];
  const age = vehicleAge(candidate);
  const practicalBody = ["suv", "wagon", "van", "crossover"].includes(candidate.bodyStyle);
  const compactBody = ["hatchback", "sedan"].includes(candidate.bodyStyle);

  for (const priority of criteria.priorities) {
    if (priority === "lowest_monthly") {
      points += Math.max(0, 220 - estimate.totalMad / 35);
      reasons.push("Mensuel bas");
    }
    if (priority === "reliability") {
      const reliabilityPoints = isNewCandidate(candidate) ? 140 : age !== null && age <= 10 ? 95 : 30;
      points += reliabilityPoints;
      reasons.push("Risque limite");
    }
    if (priority === "cheap_maintenance") {
      points += candidate.priceMad < 180000 ? 120 : candidate.priceMad < 300000 ? 70 : 15;
      reasons.push("Entretien accessible");
    }
    if (priority === "fuel_economy") {
      points += inferredFuel === "hybrid" || inferredFuel === "diesel" || inferredFuel === "electric" ? 120 : 45;
      reasons.push("Consommation maitrisee");
    }
    if (priority === "family_space") {
      points += practicalBody ? 160 : compactBody ? 35 : 80;
      if (candidate.seats && candidate.seats >= 5) points += 60;
      reasons.push("Espace familial");
    }
    if (priority === "long_distance_comfort") {
      points += practicalBody || candidate.bodyStyle === "sedan" ? 120 : 35;
      reasons.push("Confort route");
    }
    if (priority === "safety") {
      points += isNewCandidate(candidate) || (age !== null && age <= 8) ? 110 : 35;
      reasons.push("Securite");
    }
    if (priority === "resale_value") {
      points += ["Dacia", "Renault", "Toyota", "Hyundai", "Kia", "Volkswagen"].includes(candidate.brand) ? 120 : 45;
      reasons.push("Revente facile");
    }
    if (priority === "premium_feel") {
      points += ["BMW", "Mercedes-Benz", "Audi", "Lexus", "Volvo"].includes(candidate.brand) ? 180 : candidate.priceMad > 300000 ? 80 : 10;
      reasons.push("Image premium");
    }
    if (priority === "easy_city_parking") {
      points += compactBody ? 150 : candidate.bodyStyle === "suv" ? 25 : 70;
      reasons.push("Facile en ville");
    }
  }

  if (criteria.trunkNeed === "high" && practicalBody) points += 80;
  if (criteria.parkingNeed === "high" && compactBody) points += 80;

  return { points, reasons };
}
```

- [ ] **Step 4: Apply priority score inside `rankCandidates`**

Inside the `map` callback in `rankCandidates`, after age scoring and before source-name scoring, add:

```ts
      const priorities = priorityScore(candidate, estimate, inferredFuel, criteria);
      score += priorities.points;
      reasons.push(...priorities.reasons);
```

- [ ] **Step 5: Run priority tests**

Run:

```bash
npx tsx --test --test-name-pattern "priority" lib/matching/score.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run all scoring tests**

Run:

```bash
npx tsx --test lib/matching/score.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit priority slice**

Run:

```bash
git add lib/matching/score.ts lib/matching/score.test.ts
git commit -m "feat: rank cars by buyer priorities"
```

---

### Task 4: Matching Dictionary Copy

**Files:**
- Modify: `lib/i18n/dictionaries/fr.json`
- Modify: `lib/i18n/dictionaries/en.json`
- Modify: `lib/i18n/dictionaries/ar.json`

- [ ] **Step 1: Add the new matching keys to French**

In `lib/i18n/dictionaries/fr.json`, inside `matching`, replace `usageOptions` with:

```json
"usageOptions": [
  { "value": "town", "label": "Ville" },
  { "value": "mixed", "label": "Mixte" },
  { "value": "long_distance", "label": "Route" }
]
```

Then add:

```json
"advisor": {
  "progress": "Étape",
  "next": "Continuer",
  "back": "Retour",
  "modeTitle": "Comment voulez-vous acheter ?",
  "modeSub": "On commence par la réalité du paiement, pas par un budget vague.",
  "affordabilityTitle": "Quelle limite vous met à l’aise ?",
  "usageTitle": "Où roulerez-vous le plus ?",
  "spaceTitle": "Qui et quoi doit rentrer ?",
  "prioritiesTitle": "Qu’est-ce qui compte le plus ?",
  "prioritiesSub": "Choisissez jusqu’à 3 priorités.",
  "showResults": "Voir mes matchs"
},
"modes": [
  { "value": "cash", "label": "Cash", "description": "Montant total disponible" },
  { "value": "credit", "label": "Crédit", "description": "Mensualité, apport, durée" },
  { "value": "mourabaha", "label": "Mourabaha", "description": "Mensualité avec marge estimée" },
  { "value": "unsure", "label": "Pas sûr", "description": "On compare les scénarios" }
],
"scenario": {
  "summary": "Scénario",
  "adjust": "Ajuster",
  "update": "Mettre à jour",
  "cashBudget": "Budget cash",
  "monthlyBudget": "Mensualité confortable",
  "downPayment": "Apport",
  "duration": "Durée",
  "familySize": "Taille de famille",
  "trunkNeed": "Coffre",
  "parkingNeed": "Parking facile",
  "advancedMarket": "Marché avancé",
  "allMarkets": "Auto",
  "newMarket": "Neuf",
  "usedMarket": "Occasion / import"
},
"needLevels": [
  { "value": "low", "label": "Faible" },
  { "value": "medium", "label": "Moyen" },
  { "value": "high", "label": "Fort" }
],
"priorityOptions": [
  { "value": "lowest_monthly", "label": "Mensuel le plus bas" },
  { "value": "reliability", "label": "Fiabilité" },
  { "value": "cheap_maintenance", "label": "Entretien pas cher" },
  { "value": "fuel_economy", "label": "Consommation" },
  { "value": "family_space", "label": "Espace famille" },
  { "value": "long_distance_comfort", "label": "Longs trajets" },
  { "value": "safety", "label": "Sécurité" },
  { "value": "resale_value", "label": "Revente" },
  { "value": "premium_feel", "label": "Image premium" },
  { "value": "easy_city_parking", "label": "Ville facile" }
],
"candidateLabels": {
  "new": "Neuf",
  "used": "Occasion",
  "import": "Import baseline",
  "bestValue": "Bon rapport valeur",
  "lowerRisk": "Risque limité",
  "moreSpace": "Plus d’espace"
}
```

- [ ] **Step 2: Add English keys**

In `lib/i18n/dictionaries/en.json`, inside `matching`, replace `usageOptions` with:

```json
"usageOptions": [
  { "value": "town", "label": "Town" },
  { "value": "mixed", "label": "Mixed" },
  { "value": "long_distance", "label": "Long distance" }
]
```

Then add:

```json
"advisor": {
  "progress": "Step",
  "next": "Continue",
  "back": "Back",
  "modeTitle": "How do you want to buy?",
  "modeSub": "We start with payment reality, not a vague budget.",
  "affordabilityTitle": "What limit feels comfortable?",
  "usageTitle": "Where will you drive most?",
  "spaceTitle": "Who and what needs to fit?",
  "prioritiesTitle": "What matters most?",
  "prioritiesSub": "Choose up to 3 priorities.",
  "showResults": "Show my matches"
},
"modes": [
  { "value": "cash", "label": "Cash", "description": "Total amount available" },
  { "value": "credit", "label": "Credit", "description": "Monthly payment, down payment, duration" },
  { "value": "mourabaha", "label": "Mourabaha", "description": "Monthly payment with estimated margin" },
  { "value": "unsure", "label": "Not sure", "description": "We compare the scenarios" }
],
"scenario": {
  "summary": "Scenario",
  "adjust": "Adjust",
  "update": "Update",
  "cashBudget": "Cash budget",
  "monthlyBudget": "Comfortable monthly payment",
  "downPayment": "Down payment",
  "duration": "Duration",
  "familySize": "Family size",
  "trunkNeed": "Trunk",
  "parkingNeed": "Easy parking",
  "advancedMarket": "Advanced market",
  "allMarkets": "Auto",
  "newMarket": "New",
  "usedMarket": "Used / import"
},
"needLevels": [
  { "value": "low", "label": "Low" },
  { "value": "medium", "label": "Medium" },
  { "value": "high", "label": "High" }
],
"priorityOptions": [
  { "value": "lowest_monthly", "label": "Lowest monthly" },
  { "value": "reliability", "label": "Reliability" },
  { "value": "cheap_maintenance", "label": "Cheap maintenance" },
  { "value": "fuel_economy", "label": "Fuel economy" },
  { "value": "family_space", "label": "Family space" },
  { "value": "long_distance_comfort", "label": "Long trips" },
  { "value": "safety", "label": "Safety" },
  { "value": "resale_value", "label": "Resale" },
  { "value": "premium_feel", "label": "Premium feel" },
  { "value": "easy_city_parking", "label": "Easy city parking" }
],
"candidateLabels": {
  "new": "New",
  "used": "Used",
  "import": "Import baseline",
  "bestValue": "Best value",
  "lowerRisk": "Lower risk",
  "moreSpace": "More space"
}
```

- [ ] **Step 3: Add Arabic keys**

In `lib/i18n/dictionaries/ar.json`, inside `matching`, replace `usageOptions` with:

```json
"usageOptions": [
  { "value": "town", "label": "مدينة" },
  { "value": "mixed", "label": "مختلط" },
  { "value": "long_distance", "label": "طريق طويل" }
]
```

Then add:

```json
"advisor": {
  "progress": "الخطوة",
  "next": "متابعة",
  "back": "رجوع",
  "modeTitle": "كيف تريد شراء السيارة؟",
  "modeSub": "نبدأ بطريقة الأداء الحقيقية، وليس بميزانية عامة.",
  "affordabilityTitle": "ما الحد الذي يناسبك؟",
  "usageTitle": "أين ستقود أكثر؟",
  "spaceTitle": "من وماذا يجب أن يتسع؟",
  "prioritiesTitle": "ما الأهم بالنسبة لك؟",
  "prioritiesSub": "اختر حتى 3 أولويات.",
  "showResults": "أرني الاختيارات"
},
"modes": [
  { "value": "cash", "label": "كاش", "description": "المبلغ الكامل المتاح" },
  { "value": "credit", "label": "قرض", "description": "شهرية، تسبيق، ومدة" },
  { "value": "mourabaha", "label": "مرابحة", "description": "شهرية بهامش تقديري" },
  { "value": "unsure", "label": "غير متأكد", "description": "نقارن السيناريوهات" }
],
"scenario": {
  "summary": "السيناريو",
  "adjust": "تعديل",
  "update": "تحديث",
  "cashBudget": "ميزانية الكاش",
  "monthlyBudget": "الشهرية المريحة",
  "downPayment": "التسبيق",
  "duration": "المدة",
  "familySize": "حجم العائلة",
  "trunkNeed": "الصندوق",
  "parkingNeed": "سهولة الركن",
  "advancedMarket": "السوق المتقدم",
  "allMarkets": "تلقائي",
  "newMarket": "جديد",
  "usedMarket": "مستعمل / مستورد"
},
"needLevels": [
  { "value": "low", "label": "ضعيف" },
  { "value": "medium", "label": "متوسط" },
  { "value": "high", "label": "مهم" }
],
"priorityOptions": [
  { "value": "lowest_monthly", "label": "أقل شهرية" },
  { "value": "reliability", "label": "الموثوقية" },
  { "value": "cheap_maintenance", "label": "صيانة رخيصة" },
  { "value": "fuel_economy", "label": "استهلاك الوقود" },
  { "value": "family_space", "label": "مساحة العائلة" },
  { "value": "long_distance_comfort", "label": "الطرق الطويلة" },
  { "value": "safety", "label": "السلامة" },
  { "value": "resale_value", "label": "إعادة البيع" },
  { "value": "premium_feel", "label": "إحساس فاخر" },
  { "value": "easy_city_parking", "label": "سهولة المدينة" }
],
"candidateLabels": {
  "new": "جديد",
  "used": "مستعمل",
  "import": "استيراد baseline",
  "bestValue": "قيمة جيدة",
  "lowerRisk": "مخاطر أقل",
  "moreSpace": "مساحة أكبر"
}
```

- [ ] **Step 4: Validate JSON**

Run:

```bash
node -e "for (const f of ['fr','en','ar']) { JSON.parse(require('fs').readFileSync(`lib/i18n/dictionaries/${f}.json`, 'utf8')); console.log(`${f} ok`) }"
```

Expected output:

```text
fr ok
en ok
ar ok
```

- [ ] **Step 5: Commit dictionary slice**

Run:

```bash
git add lib/i18n/dictionaries/fr.json lib/i18n/dictionaries/en.json lib/i18n/dictionaries/ar.json
git commit -m "feat: add mobile scenario matching copy"
```

---

### Task 5: Mobile Advisor Form Component

**Files:**
- Create: `components/matching/mobile-advisor-form.tsx`
- Modify: `app/[locale]/trouver/page.tsx`

- [ ] **Step 1: Create component directory**

Run:

```bash
mkdir -p components/matching
```

- [ ] **Step 2: Create the client stepper component**

Create `components/matching/mobile-advisor-form.tsx` with this structure:

```tsx
"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, CarFront, Search } from "lucide-react"

import type { MatchCriteria } from "@/lib/matching/score"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string; description?: string }
type MatchingLabels = {
  advisor: Record<string, string>
  modes: Option[]
  scenario: Record<string, string>
  needLevels: Option[]
  priorityOptions: Option[]
  usageOptions: Option[]
  annualKmOptions: Option[]
  seatOptions: Option[]
}

export function MobileAdvisorForm({
  locale,
  labels,
  criteria,
}: {
  locale: Locale
  labels: MatchingLabels
  criteria: MatchCriteria
}) {
  const [step, setStep] = useState(0)
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(criteria.priorities)
  const totalSteps = 5

  function togglePriority(value: string) {
    setSelectedPriorities((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value)
      }
      if (current.length >= 3) return current
      return [...current, value]
    })
  }

  return (
    <form action={`/${locale}/trouver`} className="plate bg-bitume p-4 shadow-2xl shadow-black/20 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-jaune">
            {labels.advisor.progress} {step + 1}/{totalSteps}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold uppercase text-signal">
            {step === 0 && labels.advisor.modeTitle}
            {step === 1 && labels.advisor.affordabilityTitle}
            {step === 2 && labels.advisor.usageTitle}
            {step === 3 && labels.advisor.spaceTitle}
            {step === 4 && labels.advisor.prioritiesTitle}
          </h2>
        </div>
        <CarFront className="text-jaune" size={26} aria-hidden="true" />
      </div>

      <div className="mt-5">
        {step === 0 && (
          <RadioCards name="mode" selected={criteria.mode} options={labels.modes} columns="grid-cols-2" />
        )}

        {step === 1 && (
          <div className="grid gap-3">
            <MoneyField name="cashBudget" label={labels.scenario.cashBudget} defaultValue={criteria.cashBudgetMad} />
            <MoneyField name="monthlyBudget" label={labels.scenario.monthlyBudget} defaultValue={criteria.monthlyBudgetMad} />
            <MoneyField name="downPayment" label={labels.scenario.downPayment} defaultValue={criteria.downPaymentMad || null} />
            <SelectField name="durationMonths" label={labels.scenario.duration} selected={String(criteria.durationMonths)} options={[
              { value: "48", label: "48m" },
              { value: "60", label: "60m" },
              { value: "72", label: "72m" },
              { value: "84", label: "84m" }
            ]} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3">
            <RadioCards name="usage" selected={criteria.usage} options={labels.usageOptions} columns="grid-cols-3" />
            <SelectField name="annualKm" label="km/an" selected={String(criteria.annualKm)} options={labels.annualKmOptions} />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3">
            <RadioCards name="minSeats" selected={criteria.minSeats} options={labels.seatOptions} columns="grid-cols-3" />
            <SelectField name="familySize" label={labels.scenario.familySize} selected={String(criteria.familySize ?? "")} options={[
              { value: "", label: "-" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5+" }
            ]} />
            <SelectField name="trunkNeed" label={labels.scenario.trunkNeed} selected={criteria.trunkNeed} options={labels.needLevels} />
            <SelectField name="parkingNeed" label={labels.scenario.parkingNeed} selected={criteria.parkingNeed} options={labels.needLevels} />
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="text-sm text-ink-2-dark">{labels.advisor.prioritiesSub}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {labels.priorityOptions.map((option) => {
                const active = selectedPriorities.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => togglePriority(option.value)}
                    className={cn(
                      "min-h-12 border px-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.08em]",
                      active ? "border-jaune bg-jaune text-asphalte" : "border-signal/15 text-signal/70"
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            <input type="hidden" name="priorities" value={selectedPriorities.join(",")} />
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-signal/20 px-4 font-display text-base font-bold uppercase tracking-wider text-signal/75 disabled:opacity-35"
          disabled={step === 0}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {labels.advisor.back}
        </button>
        {step < totalSteps - 1 ? (
          <button
            type="button"
            onClick={() => setStep((value) => Math.min(totalSteps - 1, value + 1))}
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-jaune bg-jaune px-4 font-display text-base font-bold uppercase tracking-wider text-asphalte"
          >
            {labels.advisor.next}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-rouge bg-rouge px-4 font-display text-base font-bold uppercase tracking-wider text-signal"
          >
            <Search size={18} aria-hidden="true" />
            {labels.advisor.showResults}
          </button>
        )}
      </div>
    </form>
  )
}
```

In the same file, add these helper components below `MobileAdvisorForm`:

```tsx
function RadioCards({
  name,
  selected,
  options,
  columns,
}: {
  name: string
  selected: string
  options: Option[]
  columns: "grid-cols-2" | "grid-cols-3"
}) {
  return (
    <div className={cn("grid gap-2", columns)}>
      {options.map((option) => (
        <label key={option.value} className="min-w-0">
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={selected === option.value}
            className="peer sr-only"
          />
          <span className="flex min-h-16 min-w-0 flex-col justify-center border border-signal/15 px-2 text-center transition-colors peer-checked:border-jaune peer-checked:bg-jaune peer-checked:text-asphalte">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em]">
              {option.label}
            </span>
            {option.description ? (
              <span className="mt-1 text-[11px] leading-snug opacity-75">
                {option.description}
              </span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  )
}

function MoneyField({
  name,
  label,
  defaultValue,
}: {
  name: string
  label: string
  defaultValue: number | null
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
        {label}
      </span>
      <span className="plate mt-2 flex items-stretch bg-signal">
        <input
          name={name}
          inputMode="numeric"
          defaultValue={defaultValue ?? ""}
          dir="ltr"
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-mono text-xl font-bold text-asphalte outline-none placeholder:text-asphalte/30"
        />
        <span className="my-2 w-[2px] bg-asphalte/80" aria-hidden="true" />
        <span className="flex items-center px-3 font-mono text-[11px] font-bold uppercase text-asphalte">
          MAD
        </span>
      </span>
    </label>
  )
}

function SelectField({
  label,
  name,
  selected,
  options,
}: {
  label: string
  name: string
  selected: string
  options: Option[]
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
        {label}
      </span>
      <select
        name={name}
        defaultValue={selected}
        className="mt-2 min-h-11 w-full border border-signal/15 bg-asphalte px-3 font-mono text-xs font-bold uppercase text-signal outline-none focus:border-jaune"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-asphalte">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
```

- [ ] **Step 3: Import component in route without replacing desktop yet**

In `app/[locale]/trouver/page.tsx`, add:

```ts
import { MobileAdvisorForm } from "@/components/matching/mobile-advisor-form"
```

Render it above the current `<form>` with mobile-only visibility:

```tsx
<div className="lg:hidden">
  <MobileAdvisorForm locale={locale} labels={t} criteria={criteria} />
</div>
```

Add `hidden lg:block` to the existing form:

```tsx
className="plate relative hidden w-full min-w-0 bg-bitume p-4 shadow-2xl shadow-black/20 sm:p-5 lg:block"
```

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS. If TypeScript reports dictionary type mismatches, ensure all three locale dictionaries have identical `matching` object shape.

- [ ] **Step 5: Commit advisor UI slice**

Run:

```bash
git add components/matching/mobile-advisor-form.tsx app/[locale]/trouver/page.tsx
git commit -m "feat: add mobile buyer advisor form"
```

---

### Task 6: Results Workbench Component

**Files:**
- Create: `components/matching/results-workbench.tsx`
- Modify: `app/[locale]/trouver/page.tsx`

- [ ] **Step 1: Create results workbench component**

Create `components/matching/results-workbench.tsx`:

```tsx
import Link from "next/link"
import type { ReactNode } from "react"
import { SlidersHorizontal } from "lucide-react"

import type { Locale } from "@/lib/i18n/config"
import type { MatchCriteria, RankedCandidate } from "@/lib/matching/score"

type Labels = Awaited<ReturnType<typeof import("@/lib/i18n/get-dictionary").getDictionary>>["matching"]
type Option = { value: string; label: string; description?: string }

export function ResultsWorkbench({
  locale,
  labels,
  criteria,
  children,
}: {
  locale: Locale
  labels: Labels
  criteria: MatchCriteria
  children: ReactNode
}) {
  const summary = scenarioSummary(criteria, labels)

  return (
    <div className="mt-8">
      <div className="sticky top-0 z-20 -mx-4 border-y border-signal/12 bg-asphalte/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border lg:bg-asphalte/70">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-jaune">
              {labels.scenario.summary}
            </p>
            <p className="mt-1 truncate font-mono text-xs font-bold uppercase text-signal">
              {summary}
            </p>
          </div>
          <details className="relative">
            <summary className="inline-flex min-h-10 cursor-pointer list-none items-center justify-center gap-2 border border-signal/20 px-3 font-display text-sm font-bold uppercase text-signal">
              <SlidersHorizontal size={16} aria-hidden="true" />
              {labels.scenario.adjust}
            </summary>
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-signal/12 bg-bitume p-4 shadow-2xl shadow-black lg:absolute lg:inset-auto lg:right-0 lg:top-12 lg:w-[24rem] lg:border">
              <AdjustScenarioForm locale={locale} labels={labels} criteria={criteria} />
            </div>
          </details>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {scenarioLinks(locale, criteria).map((item) => (
            <Link key={item.label} href={item.href} className="shrink-0 border border-signal/15 px-3 py-2 font-mono text-[10px] font-bold uppercase text-signal/70">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}
```

In the same file, add these helpers below `ResultsWorkbench`:

```tsx
function optionLabel(options: Option[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

function formatMad(value: number | null) {
  if (!value) return "-"
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)
}

function scenarioSummary(criteria: MatchCriteria, labels: Labels) {
  const mode = optionLabel(labels.modes, criteria.mode)
  const monthly = criteria.monthlyBudgetMad
    ? `${formatMad(criteria.monthlyBudgetMad)} MAD/mo`
    : null
  const cash = criteria.cashBudgetMad ? `${formatMad(criteria.cashBudgetMad)} MAD cash` : null
  const down = criteria.downPaymentMad ? `${formatMad(criteria.downPaymentMad)} MAD apport` : null
  const duration = criteria.mode === "cash" ? null : `${criteria.durationMonths}m`

  return [mode, monthly ?? cash, down, duration].filter(Boolean).join(" · ")
}

function scenarioHref(locale: Locale, criteria: MatchCriteria, overrides: Record<string, string>) {
  const params = new URLSearchParams()
  params.set("mode", overrides.mode ?? criteria.mode)
  if (criteria.cashBudgetMad) params.set("cashBudget", String(criteria.cashBudgetMad))
  if (criteria.monthlyBudgetMad) params.set("monthlyBudget", String(criteria.monthlyBudgetMad))
  if (criteria.downPaymentMad) params.set("downPayment", String(criteria.downPaymentMad))
  params.set("durationMonths", overrides.durationMonths ?? String(criteria.durationMonths))
  params.set("usage", criteria.usage)
  params.set("annualKm", String(criteria.annualKm))
  params.set("minSeats", criteria.minSeats)
  if (criteria.familySize) params.set("familySize", String(criteria.familySize))
  params.set("trunkNeed", criteria.trunkNeed)
  params.set("parkingNeed", criteria.parkingNeed)
  if (criteria.priorities.length) params.set("priorities", criteria.priorities.join(","))
  if (criteria.condition !== "all") params.set("condition", criteria.condition)

  return `/${locale}/trouver?${params.toString()}`
}

function scenarioLinks(locale: Locale, criteria: MatchCriteria) {
  return [
    { label: "Cash", href: scenarioHref(locale, criteria, { mode: "cash" }) },
    { label: "Credit 60m", href: scenarioHref(locale, criteria, { mode: "credit", durationMonths: "60" }) },
    { label: "Mourabaha 72m", href: scenarioHref(locale, criteria, { mode: "mourabaha", durationMonths: "72" }) },
  ]
}

function CompactSelect({
  name,
  label,
  selected,
  options,
}: {
  name: string
  label: string
  selected: string
  options: Option[]
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
        {label}
      </span>
      <select
        name={name}
        defaultValue={selected}
        className="mt-1 min-h-10 w-full border border-signal/15 bg-asphalte px-3 font-mono text-xs font-bold uppercase text-signal outline-none focus:border-jaune"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-asphalte">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function CompactMoneyField({
  name,
  label,
  value,
}: {
  name: string
  label: string
  value: number | null
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
        {label}
      </span>
      <input
        name={name}
        inputMode="numeric"
        defaultValue={value ?? ""}
        dir="ltr"
        className="mt-1 min-h-10 w-full border border-signal/15 bg-asphalte px-3 font-mono text-sm font-bold text-signal outline-none focus:border-jaune"
      />
    </label>
  )
}

function AdjustScenarioForm({
  locale,
  labels,
  criteria,
}: {
  locale: Locale
  labels: Labels
  criteria: MatchCriteria
}) {
  return (
    <form action={`/${locale}/trouver`} className="grid gap-3">
      <CompactSelect name="mode" label={labels.scenario.summary} selected={criteria.mode} options={labels.modes} />
      <CompactMoneyField name="cashBudget" label={labels.scenario.cashBudget} value={criteria.cashBudgetMad} />
      <CompactMoneyField name="monthlyBudget" label={labels.scenario.monthlyBudget} value={criteria.monthlyBudgetMad} />
      <CompactMoneyField name="downPayment" label={labels.scenario.downPayment} value={criteria.downPaymentMad || null} />
      <CompactSelect
        name="durationMonths"
        label={labels.scenario.duration}
        selected={String(criteria.durationMonths)}
        options={[
          { value: "48", label: "48m" },
          { value: "60", label: "60m" },
          { value: "72", label: "72m" },
          { value: "84", label: "84m" },
        ]}
      />
      <CompactSelect name="usage" label={labels.usageLabel} selected={criteria.usage} options={labels.usageOptions} />
      <CompactSelect name="annualKm" label={labels.annualKmLabel} selected={String(criteria.annualKm)} options={labels.annualKmOptions} />
      <CompactSelect name="minSeats" label={labels.seatsLabel} selected={criteria.minSeats} options={labels.seatOptions} />
      <CompactSelect name="trunkNeed" label={labels.scenario.trunkNeed} selected={criteria.trunkNeed} options={labels.needLevels} />
      <CompactSelect name="parkingNeed" label={labels.scenario.parkingNeed} selected={criteria.parkingNeed} options={labels.needLevels} />
      <CompactSelect
        name="condition"
        label={labels.scenario.advancedMarket}
        selected={criteria.condition}
        options={[
          { value: "all", label: labels.scenario.allMarkets },
          { value: "new", label: labels.scenario.newMarket },
          { value: "used", label: labels.scenario.usedMarket },
        ]}
      />
      <input type="hidden" name="priorities" value={criteria.priorities.join(",")} />
      <button
        type="submit"
        className="min-h-11 border border-jaune bg-jaune px-4 font-display text-sm font-bold uppercase tracking-wider text-asphalte"
      >
        {labels.scenario.update}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Wrap existing result cards**

In `app/[locale]/trouver/page.tsx`, import:

```ts
import { ResultsWorkbench } from "@/components/matching/results-workbench"
```

Wrap the existing result rendering block:

```tsx
<ResultsWorkbench locale={locale} labels={t} criteria={criteria}>
  <div className="mt-8 grid gap-4 lg:grid-cols-3">
    {matches.map((match, index) => (
      <MatchCard ... />
    ))}
  </div>
</ResultsWorkbench>
```

Keep `StateMessage` outside the workbench for database and empty states.

- [ ] **Step 3: Add candidate labels to `MatchCard`**

In `MatchCard`, derive:

```ts
const marketLabel =
  candidate.availabilityScope === "new_ma"
    ? labels.candidateLabels.new
    : candidate.availabilityScope === "imported_edge_case"
      ? labels.candidateLabels.import
      : labels.candidateLabels.used
```

Render the label near the card title:

```tsx
<span className="mt-3 inline-flex border border-jaune/45 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-jaune">
  {marketLabel}
</span>
```

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit workbench UI slice**

Run:

```bash
git add components/matching/results-workbench.tsx app/[locale]/trouver/page.tsx
git commit -m "feat: add scenario results workbench"
```

---

### Task 7: Route Cleanup And Mobile Verification

**Files:**
- Modify: `app/[locale]/trouver/page.tsx`
- Modify: `components/matching/mobile-advisor-form.tsx`
- Modify: `components/matching/results-workbench.tsx`

- [ ] **Step 1: Remove condition from default mobile intake**

Confirm `MobileAdvisorForm` does not render a `condition` input. The only `condition` control should live in `ResultsWorkbench` advanced adjustment form as:

```tsx
<select name="condition" defaultValue={criteria.condition}>
  <option value="all">{labels.scenario.allMarkets}</option>
  <option value="new">{labels.scenario.newMarket}</option>
  <option value="used">{labels.scenario.usedMarket}</option>
</select>
```

- [ ] **Step 2: Keep desktop form functional**

The existing desktop form may keep condition/body/fuel controls for now. Its submitted legacy params must still parse through `parseMatchCriteria`.

- [ ] **Step 3: Run scoring tests**

Run:

```bash
npx tsx --test lib/matching/score.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 5: Start local dev server**

Run:

```bash
npm run dev
```

Expected: Next dev server starts and prints a localhost URL.

- [ ] **Step 6: Browser check on mobile viewport**

Open:

```text
http://localhost:3000/fr/trouver
```

Verify at a phone-sized viewport:

- First visible form step is buying mode.
- There is no condition/new-used question in the default stepper.
- Priority chips cap at three selections.
- Submitting results navigates to `/fr/trouver?...` with query params.
- Results show a sticky scenario summary.
- Adjust opens a bottom sheet and submits updated query params.
- Text does not overflow buttons or cards.

- [ ] **Step 7: Commit cleanup and verification slice**

Run:

```bash
git add app/[locale]/trouver/page.tsx components/matching/mobile-advisor-form.tsx components/matching/results-workbench.tsx
git commit -m "feat: polish mobile scenario flow"
```

---

## Final Verification

- [ ] Run:

```bash
npx tsx --test lib/matching/score.test.ts
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] Run the app locally and verify `/fr/trouver`, `/en/trouver`, and `/ar/trouver` render the mobile advisor without dictionary key errors.

- [ ] Check `git status --short` and confirm only intentional task files are changed or committed.

- [ ] If ready to publish, push the branch:

```bash
git push -u origin codex/mobile-scenario-workbench
```

Expected: branch pushes to `origin`.
