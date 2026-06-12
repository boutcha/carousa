export type BodyStyle =
  | "hatchback"
  | "sedan"
  | "suv"
  | "crossover"
  | "wagon"
  | "van"
  | "pickup"
  | "coupe"
  | "convertible"
  | "other";

export type MatchBody = BodyStyle | "any";
export type MatchFuel = "any" | "gasoline" | "diesel" | "hybrid" | "electric";
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

export type CatalogCandidate = {
  id: string;
  brand: string;
  model: string;
  commercialName: string;
  trimName: string;
  bodyStyle: BodyStyle;
  availabilityScope: string;
  marketOrigin: string;
  fiscalHp: number | null;
  seats: number | null;
  modelYear: number | null;
  priceMad: number;
  sourceNames: string[];
};

export type MonthlyEstimate = {
  financingMad: number;
  insuranceMad: number;
  fuelMad: number;
  maintenanceMad: number;
  feesMad: number;
  depreciationMad: number;
  totalMad: number;
};

export type RankedCandidate = {
  candidate: CatalogCandidate;
  estimate: MonthlyEstimate;
  score: number;
  reasons: string[];
  inferredFuel: Exclude<MatchFuel, "any">;
};

const catalogSnapshotYear = 2026;

type SearchParamValue = string | string[] | undefined;
type SearchParamInput = Record<string, SearchParamValue>;

const bodyValues = new Set<MatchBody>([
  "any",
  "hatchback",
  "sedan",
  "suv",
  "crossover",
  "wagon",
  "van",
  "pickup",
  "coupe",
  "convertible",
  "other",
]);

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

function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInteger(value: SearchParamValue) {
  const raw = firstValue(value);
  if (!raw) return null;
  const parsed = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function pickOption<T extends string>(
  value: SearchParamValue,
  allowed: Set<T>,
  fallback: T,
) {
  const raw = firstValue(value);
  return raw && allowed.has(raw as T) ? (raw as T) : fallback;
}

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

function isNewCandidate(candidate: CatalogCandidate) {
  return candidate.availabilityScope === "new_ma";
}

function vehicleAge(candidate: CatalogCandidate) {
  if (!candidate.modelYear) return null;
  return Math.max(0, catalogSnapshotYear - candidate.modelYear);
}

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
    const credit = amortizedMonthlyPayment(
      principal,
      isNewCandidate(candidate) ? 0.082 : 0.095,
      criteria.durationMonths,
    );
    const mourabaha = Math.round((principal * 1.18) / criteria.durationMonths);
    return Math.min(credit, mourabaha);
  }

  return amortizedMonthlyPayment(
    principal,
    isNewCandidate(candidate) ? 0.082 : 0.095,
    criteria.durationMonths,
  );
}

export function inferFuel(candidate: CatalogCandidate): Exclude<MatchFuel, "any"> {
  const label = `${candidate.commercialName} ${candidate.trimName}`.toLowerCase();

  if (/(hybrid|hev|phev|e-tech|e tech)/.test(label)) return "hybrid";
  if (/(electric|electrique|\bev\b|\bkwh\b|\bkw\b)/.test(label)) return "electric";
  if (/(dci|hdi|bluehdi|tdi|crdi|cdi|gasoil|diesel)/.test(label)) return "diesel";

  return "gasoline";
}

export function estimateMonthlyCost(
  candidate: CatalogCandidate,
  criteria: MatchCriteria,
): MonthlyEstimate {
  const price = candidate.priceMad;
  const fiscalHp = candidate.fiscalHp ?? 6;
  const fuel = inferFuel(candidate);
  const isNew = isNewCandidate(candidate);
  const financingMad = estimateFinancingMonthly(candidate, criteria);
  const insuranceMad = Math.round(210 + fiscalHp * 20 + Math.max(price - 260000, 0) * 0.00032);
  const fuelMad = estimateFuelMonthly(candidate, criteria, fuel);
  const maintenanceMad = estimateMaintenanceMonthly(candidate);
  const feesMad = fiscalHp <= 7 ? 75 : fiscalHp <= 10 ? 100 : 145;
  const annualDepreciationRate = fuel === "electric" ? 0.11 : isNew ? 0.08 : 0.06;
  const depreciationMad = Math.round((price * annualDepreciationRate) / 12);

  return {
    financingMad,
    insuranceMad,
    fuelMad,
    maintenanceMad,
    feesMad,
    depreciationMad,
    totalMad:
      financingMad + insuranceMad + fuelMad + maintenanceMad + feesMad + depreciationMad,
  };
}

function estimateFuelMonthly(
  candidate: CatalogCandidate,
  criteria: MatchCriteria,
  fuel: Exclude<MatchFuel, "any">,
) {
  if (fuel === "electric") {
    const bodyFactor = candidate.bodyStyle === "suv" || candidate.bodyStyle === "van" ? 1.12 : 1;
    return Math.round((criteria.annualKm / 12) * 0.16 * bodyFactor * 1.45);
  }

  const mixedConsumption = {
    diesel: 4.75,
    gasoline: 6.4,
    hybrid: 4.2,
  }[fuel];
  const fuelPrice = fuel === "diesel" ? 12.38 : 14.85;
  const usageFactor =
    criteria.usage === "town" ? 1.14 : criteria.usage === "long_distance" ? 0.88 : 1;
  const bodyFactor =
    candidate.bodyStyle === "suv"
      ? 1.1
      : candidate.bodyStyle === "van" || candidate.bodyStyle === "pickup"
        ? 1.16
        : 1;
  const litersPerMonth = (criteria.annualKm / 12) * ((mixedConsumption * usageFactor * bodyFactor) / 100);

  return Math.round(litersPerMonth * fuelPrice);
}

function estimateMaintenanceMonthly(candidate: CatalogCandidate) {
  const isNew = isNewCandidate(candidate);
  const age = vehicleAge(candidate);
  const ageExtra = isNew
    ? 0
    : age === null
      ? 90
      : age <= 8
        ? 0
        : age <= 12
          ? 70
          : age <= 16
            ? 130
            : age <= 20
              ? 220
              : 340;
  const bodyExtra =
    candidate.bodyStyle === "suv"
      ? 80
      : candidate.bodyStyle === "van" || candidate.bodyStyle === "pickup"
        ? 120
        : candidate.bodyStyle === "coupe" || candidate.bodyStyle === "convertible"
          ? 150
          : 0;
  const priceExtra = candidate.priceMad > 350000 ? 120 : 0;

  return (isNew ? 250 : 420) + bodyExtra + priceExtra + ageExtra;
}

function ageScore(candidate: CatalogCandidate) {
  if (isNewCandidate(candidate)) return { points: 0, reason: null };

  const age = vehicleAge(candidate);
  if (age === null) return { points: -40, reason: null };
  if (age <= 6) return { points: 120, reason: "Millésime récent" };
  if (age <= 10) return { points: 90, reason: "Millésime récent" };
  if (age <= 14) return { points: 45, reason: null };
  if (age <= 18) return { points: -60, reason: null };
  if (age <= 22) return { points: -180, reason: null };
  return { points: -320, reason: null };
}

function familyKey(candidate: CatalogCandidate) {
  return `${candidate.brand}|${candidate.model}`.toLowerCase();
}

function diversifyRankedCandidates(matches: RankedCandidate[], limit: number) {
  const selected: RankedCandidate[] = [];
  const selectedIds = new Set<string>();
  const seenFamilies = new Set<string>();

  for (const match of matches) {
    const key = familyKey(match.candidate);
    if (seenFamilies.has(key)) continue;

    selected.push(match);
    selectedIds.add(match.candidate.id);
    seenFamilies.add(key);
    if (selected.length === limit) return selected;
  }

  for (const match of matches) {
    if (selectedIds.has(match.candidate.id)) continue;

    selected.push(match);
    if (selected.length === limit) return selected;
  }

  return selected;
}

function matchesCondition(candidate: CatalogCandidate, condition: MatchCondition) {
  if (condition === "all") return true;
  return condition === "new" ? isNewCandidate(candidate) : !isNewCandidate(candidate);
}

function matchesExplicitFilters(candidate: CatalogCandidate, criteria: MatchCriteria) {
  if (criteria.body !== "any" && candidate.bodyStyle !== criteria.body) return false;
  if (criteria.fuel !== "any" && inferFuel(candidate) !== criteria.fuel) return false;
  return true;
}

function bodyLabel(body: BodyStyle) {
  if (body === "suv") return "SUV";
  if (body === "hatchback") return "Citadine";
  if (body === "sedan") return "Berline";
  if (body === "van") return "Familiale";
  if (body === "pickup") return "Pick-up";
  return body.charAt(0).toUpperCase() + body.slice(1);
}

function fuelLabel(fuel: Exclude<MatchFuel, "any">) {
  if (fuel === "diesel") return "Diesel";
  if (fuel === "gasoline") return "Essence";
  if (fuel === "hybrid") return "Hybride";
  return "Electrique";
}

function seatScore(candidate: CatalogCandidate, seats: MatchSeats) {
  if (seats === "any") return { points: 0, reason: null };
  const wanted = Number.parseInt(seats, 10);
  const actual = candidate.seats;

  if (actual && actual >= wanted) {
    return { points: wanted >= 7 ? 180 : 120, reason: `${wanted}+ places` };
  }

  if (!actual && wanted <= 5 && ["hatchback", "sedan", "suv", "crossover", "wagon"].includes(candidate.bodyStyle)) {
    return { points: 45, reason: "Format familial probable" };
  }

  if (!actual) return { points: 0, reason: null };
  return { points: -220, reason: null };
}

export function rankCandidates(
  candidates: CatalogCandidate[],
  criteria: MatchCriteria,
  limit = 8,
): RankedCandidate[] {
  const matches = candidates
    .filter(
      (candidate) =>
        matchesCondition(candidate, criteria.condition) &&
        matchesExplicitFilters(candidate, criteria),
    )
    .map((candidate) => {
      const estimate = estimateMonthlyCost(candidate, criteria);
      const inferredFuel = inferFuel(candidate);
      const reasons: string[] = [];
      let score = 0;

      if (criteria.mode === "cash" && criteria.cashBudgetMad) {
        const budgetDelta = criteria.cashBudgetMad - candidate.priceMad;
        if (candidate.priceMad > criteria.cashBudgetMad * 1.08) return null;
        if (budgetDelta >= 0) {
          score += 300 + Math.min(180, (budgetDelta / criteria.cashBudgetMad) * 180);
          reasons.push("Budget respecte");
        } else {
          score -= Math.abs(budgetDelta) / 4;
        }
      } else if (criteria.budgetMad) {
        const budgetDelta = criteria.budgetMad - estimate.totalMad;
        if (estimate.totalMad > criteria.budgetMad * 1.08) return null;
        if (budgetDelta >= 0) {
          score += 300 + Math.min(180, (budgetDelta / criteria.budgetMad) * 180);
          reasons.push("Budget respecte");
        } else {
          score -= Math.abs(budgetDelta) / 4;
        }
      }

      if (criteria.body !== "any" && candidate.bodyStyle === criteria.body) {
        score += 250;
        reasons.push(bodyLabel(candidate.bodyStyle));
      }

      if (criteria.fuel !== "any" && inferredFuel === criteria.fuel) {
        score += 160;
        reasons.push(fuelLabel(inferredFuel));
      }

      const seats = seatScore(candidate, criteria.seats);
      score += seats.points;
      if (seats.reason) reasons.push(seats.reason);

      const age = ageScore(candidate);
      score += age.points;
      if (age.reason) reasons.push(age.reason);

      if (criteria.condition === "new" && isNewCandidate(candidate)) {
        score += 80;
        reasons.push("Neuve Maroc");
      }

      score += Math.min(candidate.sourceNames.length * 25, 75);
      score += Math.max(0, 120 - estimate.totalMad / 50);

      return {
        candidate,
        estimate,
        inferredFuel,
        reasons: reasons.length ? reasons : ["Prix source"],
        score,
      };
    })
    .filter((match): match is RankedCandidate => match !== null)
    .sort((a, b) => b.score - a.score || a.estimate.totalMad - b.estimate.totalMad);

  return diversifyRankedCandidates(matches, limit);
}
