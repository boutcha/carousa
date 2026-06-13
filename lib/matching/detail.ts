import type {
  CatalogCandidate,
  MatchCriteria,
  MonthlyEstimate,
} from "./score";

export type DetailRiskLevel = "low" | "medium" | "high";
export type DetailItemKind = "fact" | "pro" | "con";
export type DetailItem = {
  key: string;
  label: string;
  value: string;
  kind: DetailItemKind;
};

export type VehicleDetailIssue = {
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedSystem: string;
  confidence: number;
  sourceName: string | null;
  notes: string | null;
};

export type VehicleDetailAssessment = {
  riskLevel: DetailRiskLevel;
  facts: DetailItem[];
  pros: DetailItem[];
  cons: DetailItem[];
};

export type ParsedCatalogCandidateId = {
  vehicleVersionId: string;
  sourceKind: "po" | "vy";
  sourceRecordId: string;
};

type CreateAssessmentInput = {
  candidate: CatalogCandidate;
  criteria: MatchCriteria;
  estimate: MonthlyEstimate;
  issues: VehicleDetailIssue[];
  maintenanceScheduleCount: number;
};

export function parseCatalogCandidateId(id: string): ParsedCatalogCandidateId | null {
  const [vehicleVersionId, sourceKind, sourceRecordId, ...rest] = id.split(":");
  if (!vehicleVersionId || !sourceRecordId || rest.length > 0) return null;
  if (sourceKind !== "po" && sourceKind !== "vy") return null;
  return { vehicleVersionId, sourceKind, sourceRecordId };
}

export function createVehicleDetailAssessment({
  candidate,
  criteria,
  estimate,
  issues,
  maintenanceScheduleCount,
}: CreateAssessmentInput): VehicleDetailAssessment {
  const facts: DetailItem[] = [
    {
      key: "source_price",
      label: "Source price",
      value: `${candidate.priceMad} MAD`,
      kind: "fact",
    },
    {
      key: "monthly_cost",
      label: "Estimated true monthly cost",
      value: `${estimate.totalMad} MAD`,
      kind: "fact",
    },
    {
      key: "official_recalls",
      label: "Official recall facts matched",
      value: String(candidate.officialRecallCount),
      kind: "fact",
    },
    {
      key: "maintenance_items",
      label: "Maintenance schedule items",
      value: String(maintenanceScheduleCount),
      kind: "fact",
    },
  ];

  const pros: DetailItem[] = [];
  const cons: DetailItem[] = [];
  const highRiskIssueCount = issues.filter(
    (issue) => issue.severity === "high" || issue.severity === "critical",
  ).length;

  if (candidate.sourceNames.length > 0) {
    pros.push({
      key: "official_price_source",
      label: "Sourced price",
      value: candidate.sourceNames.join(" · "),
      kind: "pro",
    });
  }

  if (candidate.officialRecallCount === 0) {
    pros.push({
      key: "clean_recall_record",
      label: "No matched official recall facts",
      value: "No NHTSA recall facts matched this generation/year in our catalog.",
      kind: "pro",
    });
  }

  if (candidate.seats && candidate.seats >= 5) {
    pros.push({
      key: "family_space",
      label: "Family usable",
      value: `${candidate.seats} seats with a ${candidate.bodyStyle} format.`,
      kind: "pro",
    });
  }

  if (candidate.marketOrigin === "morocco_official") {
    pros.push({
      key: "morocco_official",
      label: "Morocco-market baseline",
      value: "Catalog row is attached to Morocco official or local used-market data.",
      kind: "pro",
    });
  }

  if (maintenanceScheduleCount > 0) {
    pros.push({
      key: "maintenance_plan",
      label: "Maintenance plan available",
      value: `${maintenanceScheduleCount} schedule item${maintenanceScheduleCount === 1 ? "" : "s"} matched.`,
      kind: "pro",
    });
  }

  const budget =
    criteria.mode === "cash" ? criteria.cashBudgetMad : criteria.monthlyBudgetMad;
  if (criteria.mode === "cash" && budget !== null && candidate.priceMad > budget) {
    cons.push({
      key: "over_cash_budget",
      label: "Above cash budget",
      value: `${candidate.priceMad - budget} MAD over the selected cash budget.`,
      kind: "con",
    });
  } else if (criteria.mode !== "cash" && budget !== null && estimate.totalMad > budget) {
    cons.push({
      key: "over_monthly_budget",
      label: "Above monthly comfort zone",
      value: `${estimate.totalMad - budget} MAD/month over the selected scenario.`,
      kind: "con",
    });
  }

  if (
    candidate.criticalRecallCount > 0 ||
    candidate.highSeverityRecallCount >= 2 ||
    candidate.officialRecallCount >= 6
  ) {
    cons.push({
      key: "official_recall_attention",
      label: "Official recall attention",
      value: `${candidate.officialRecallCount} official recall fact${candidate.officialRecallCount === 1 ? "" : "s"} matched, including ${candidate.highSeverityRecallCount} high/critical.`,
      kind: "con",
    });
  }

  if (candidate.marketOrigin === "morocco_used_import") {
    cons.push({
      key: "import_verification",
      label: "Import verification needed",
      value: "Confirm VIN, parts compatibility, and service history before relying on this match.",
      kind: "con",
    });
  }

  if (highRiskIssueCount > 0) {
    cons.push({
      key: "known_issue_risk",
      label: "Known issue risk",
      value: `${highRiskIssueCount} high/critical known issue${highRiskIssueCount === 1 ? "" : "s"} matched.`,
      kind: "con",
    });
  }

  const riskLevel: DetailRiskLevel =
    candidate.criticalRecallCount > 0 || highRiskIssueCount >= 2
      ? "high"
      : candidate.highSeverityRecallCount > 0 || candidate.officialRecallCount >= 3
        ? "medium"
        : "low";

  return { riskLevel, facts, pros, cons };
}
