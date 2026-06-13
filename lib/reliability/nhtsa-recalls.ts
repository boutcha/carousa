import { createHash } from "node:crypto";

import type {
  IssueSeverity,
  IssueSystem,
} from "./seed-plan";

export type NhtsaRecallRecord = {
  recordId: string;
  campaignNumber: string;
  make: string;
  model: string;
  modelYear: number;
  manufacturerCampaignNumber: string | null;
  component: string;
  manufacturerName: string | null;
  recallTypeCode: string;
  potentialUnitsAffected: number | null;
  ownerNotificationDate: string | null;
  recallInitiatedBy: string | null;
  reportReceivedDate: string | null;
  defectSummary: string;
  consequenceSummary: string;
  correctiveAction: string;
  notes: string | null;
  recalledComponentId: string | null;
  manufacturerComponentName: string | null;
  manufacturerComponentDescription: string | null;
  manufacturerComponentPartNumber: string | null;
  doNotDrive: boolean;
  parkOutside: boolean;
};

export type NhtsaCatalogGeneration = {
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  generationId: string;
  generationName: string;
  startsYear: number;
  endsYear: number | null;
};

export type NhtsaPlannedIssue = {
  campaignNumber: string;
  slug: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  affectedSystem: IssueSystem;
  typicalMileageMinKm: null;
  typicalMileageMaxKm: null;
  confidence: number;
};

export type NhtsaPlannedApplicability = {
  issueSlug: string;
  campaignNumber: string;
  generationId: string;
  modelYearStart: number;
  modelYearEnd: number;
  marketCode: null;
  notes: string;
  sourceRecordIds: string[];
};

export type NhtsaUnmatchedRecord = {
  campaignNumber: string;
  make: string;
  model: string;
  modelYear: number;
  component: string;
};

export type NhtsaRecallImportPlan = {
  issues: NhtsaPlannedIssue[];
  applicability: NhtsaPlannedApplicability[];
  unmatchedRecords: NhtsaUnmatchedRecord[];
  summary: {
    totalRecords: number;
    vehicleRecords: number;
    matchedRecords: number;
    unmatchedRecords: number;
    issueCount: number;
    campaignCount: number;
    applicabilityCount: number;
  };
};

type CreatePlanOptions = {
  maxUnmatchedRecords?: number;
};

const sourceUrlBase = "https://www.nhtsa.gov/recalls";

const severityRank: Record<IssueSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const makeAliases = new Map([
  ["vw", "volkswagen"],
  ["volkswagen group of america", "volkswagen"],
  ["mercedes", "mercedes benz"],
  ["mercedesbenz", "mercedes benz"],
  ["mb", "mercedes benz"],
  ["mini cooper", "mini"],
  ["range rover", "land rover"],
  ["chevy", "chevrolet"],
]);

const modelAliases = new Map([
  ["golf gti", "golf"],
  ["golf r", "golf"],
  ["jetta gli", "jetta"],
  ["c class", "classe c"],
  ["e class", "classe e"],
  ["s class", "classe s"],
  ["a class", "classe a"],
  ["glc class", "glc"],
  ["gle class", "gle"],
  ["gls class", "gls"],
]);

function valueOrNull(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalInteger(value: string | undefined) {
  const normalized = (value ?? "").replace(/[^\d-]/g, "");
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: string | undefined) {
  return /^y(es)?$/i.test((value ?? "").trim());
}

function cleanText(value: string | undefined) {
  return (value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function normalizeKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function compactKey(value: string) {
  return normalizeKey(value).replace(/\s+/g, "");
}

function slugPart(value: string) {
  const slug = normalizeKey(value).replace(/\s+/g, "-").replace(/^-|-$/g, "");
  return slug || createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function canonicalMake(value: string) {
  const normalized = normalizeKey(value);
  return makeAliases.get(normalized) ?? normalized;
}

function canonicalModel(value: string) {
  const normalized = normalizeKey(value);
  return modelAliases.get(normalized) ?? normalized;
}

function removeMakePrefix(recallModel: string, recallMake: string) {
  const model = normalizeKey(recallModel);
  const make = canonicalMake(recallMake);
  if (make && model.startsWith(`${make} `)) return model.slice(make.length + 1).trim();
  return model;
}

function modelMatches(catalogModelName: string, recallModelName: string, recallMake: string) {
  const catalogModel = canonicalModel(catalogModelName);
  const recallModel = canonicalModel(removeMakePrefix(recallModelName, recallMake));

  if (catalogModel === recallModel) return true;
  if (compactKey(catalogModel) === compactKey(recallModel)) return true;

  const catalogTokens = catalogModel.split(" ").filter(Boolean);
  const recallTokens = new Set(recallModel.split(" ").filter(Boolean));

  if (catalogTokens.length === 1) {
    const token = catalogTokens[0];
    if (token.length < 3) return false;
    return recallTokens.has(token);
  }

  return catalogTokens.every((token) => recallTokens.has(token));
}

function campaignSlug(campaignNumber: string) {
  return `nhtsa-recall-${slugPart(campaignNumber)}`.slice(0, 220);
}

function inferAffectedSystem(component: string, defectSummary: string): IssueSystem {
  const text = normalizeKey(`${component} ${defectSummary}`);

  if (/\b(brake|abs)\b/.test(text)) return "brakes";
  if (/\b(transmission|power train|drivetrain|clutch|gear)\b/.test(text)) {
    return "transmission";
  }
  if (/\b(engine|fuel|throttle|accelerator|cooling|exhaust)\b/.test(text)) return "engine";
  if (/\b(electrical|lighting|software|camera|display|sensor|battery|charging)\b/.test(text)) {
    return text.includes("software") ? "software" : "electrical";
  }
  if (/\b(suspension|steering|wheel|tire|axle)\b/.test(text)) return "suspension";
  if (/\b(structure|body|door|hood|latch|lock|glass|visibility|wiper)\b/.test(text)) {
    return "body";
  }
  if (/\b(air bag|airbag|seat belt|seat|child restraint)\b/.test(text)) return "interior";
  if (/\b(emission|catalyst|evaporative)\b/.test(text)) return "emissions";

  return "other";
}

function inferSeverity(record: NhtsaRecallRecord, affectedSystem: IssueSystem): IssueSeverity {
  const text = normalizeKey(`${record.defectSummary} ${record.consequenceSummary} ${record.notes ?? ""}`);

  if (record.doNotDrive || record.parkOutside) return "critical";
  if (/\b(death|fatal|fire|crash|injury|loss of control)\b/.test(text)) return "high";
  if (["brakes", "suspension", "transmission"].includes(affectedSystem)) return "high";
  if (["engine", "electrical", "software", "body", "interior"].includes(affectedSystem)) {
    return "medium";
  }
  return "low";
}

function issueTitle(record: NhtsaRecallRecord) {
  const component = record.component || `${record.make} ${record.model}`;
  return truncate(`NHTSA recall ${record.campaignNumber}: ${component}`, 180);
}

function issueDescription(record: NhtsaRecallRecord) {
  const lines = [
    `Official NHTSA recall ${record.campaignNumber}.`,
    record.defectSummary ? `Defect: ${record.defectSummary}` : null,
    record.consequenceSummary ? `Consequence: ${record.consequenceSummary}` : null,
    record.correctiveAction ? `Remedy: ${record.correctiveAction}` : null,
    record.doNotDrive ? "Advisory: Do not drive until the recall remedy is confirmed." : null,
    record.parkOutside ? "Advisory: Park outside until the recall remedy is confirmed." : null,
    record.notes ? `Notes: ${record.notes}` : null,
    `Source: ${sourceUrlBase} / campaign ${record.campaignNumber}.`,
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n\n");
}

function createIssue(record: NhtsaRecallRecord): NhtsaPlannedIssue {
  const affectedSystem = inferAffectedSystem(record.component, record.defectSummary);
  return {
    campaignNumber: record.campaignNumber,
    slug: campaignSlug(record.campaignNumber),
    title: issueTitle(record),
    description: issueDescription(record),
    severity: inferSeverity(record, affectedSystem),
    affectedSystem,
    typicalMileageMinKm: null,
    typicalMileageMaxKm: null,
    confidence: 0.95,
  };
}

function mergeIssue(existing: NhtsaPlannedIssue, next: NhtsaPlannedIssue) {
  if (severityRank[next.severity] > severityRank[existing.severity]) {
    existing.severity = next.severity;
  }
  if (existing.affectedSystem === "other" && next.affectedSystem !== "other") {
    existing.affectedSystem = next.affectedSystem;
  }
  if (next.description.length > existing.description.length) {
    existing.description = next.description;
  }
}

function generationMatches(generation: NhtsaCatalogGeneration, record: NhtsaRecallRecord) {
  if (canonicalMake(generation.brandName) !== canonicalMake(record.make)) return false;
  if (!modelMatches(generation.modelName, record.model, record.make)) return false;
  const endsYear = generation.endsYear ?? 9999;
  return generation.startsYear <= record.modelYear && record.modelYear <= endsYear;
}

function applicabilityNotes(record: NhtsaRecallRecord, generation: NhtsaCatalogGeneration) {
  const affectedUnits = record.potentialUnitsAffected
    ? ` Potential NHTSA units affected: ${record.potentialUnitsAffected}.`
    : "";
  return [
    `Matched from official NHTSA recall ${record.campaignNumber} for ${record.make} ${record.model} ${record.modelYear}.`,
    `US-market recall; verify VIN, import market, and Morocco applicability before presenting as vehicle-specific certainty.`,
    `Catalog match: ${generation.brandName} ${generation.modelName} ${generation.generationName}.${affectedUnits}`,
  ].join(" ");
}

export function parseNhtsaRecallLine(line: string): NhtsaRecallRecord | null {
  const fields = line.replace(/\r$/, "").split("\t");
  if (fields.length < 29) return null;

  const recallTypeCode = cleanText(fields[10]).toUpperCase();
  const modelYear = parseOptionalInteger(fields[4]);
  const campaignNumber = cleanText(fields[1]).toUpperCase();

  if (recallTypeCode !== "V") return null;
  if (!campaignNumber || !modelYear || modelYear === 9999) return null;

  return {
    recordId: cleanText(fields[0]),
    campaignNumber,
    make: cleanText(fields[2]).toUpperCase(),
    model: cleanText(fields[3]).toUpperCase(),
    modelYear,
    manufacturerCampaignNumber: valueOrNull(cleanText(fields[5])),
    component: cleanText(fields[6]),
    manufacturerName: valueOrNull(cleanText(fields[7])),
    recallTypeCode,
    potentialUnitsAffected: parseOptionalInteger(fields[11]),
    ownerNotificationDate: valueOrNull(cleanText(fields[12])),
    recallInitiatedBy: valueOrNull(cleanText(fields[13])),
    reportReceivedDate: valueOrNull(cleanText(fields[15])),
    defectSummary: cleanText(fields[19]),
    consequenceSummary: cleanText(fields[20]),
    correctiveAction: cleanText(fields[21]),
    notes: valueOrNull(cleanText(fields[22])),
    recalledComponentId: valueOrNull(cleanText(fields[23])),
    manufacturerComponentName: valueOrNull(cleanText(fields[24])),
    manufacturerComponentDescription: valueOrNull(cleanText(fields[25])),
    manufacturerComponentPartNumber: valueOrNull(cleanText(fields[26])),
    doNotDrive: parseBoolean(fields[27]),
    parkOutside: parseBoolean(fields[28]),
  };
}

export function createNhtsaRecallImportPlan(
  catalogGenerations: NhtsaCatalogGeneration[],
  records: NhtsaRecallRecord[],
  options: CreatePlanOptions = {},
): NhtsaRecallImportPlan {
  const maxUnmatchedRecords = options.maxUnmatchedRecords ?? 100;
  const issuesBySlug = new Map<string, NhtsaPlannedIssue>();
  const applicabilityByKey = new Map<string, NhtsaPlannedApplicability>();
  const unmatchedRecords: NhtsaUnmatchedRecord[] = [];
  let matchedRecords = 0;

  for (const record of records) {
    const matchedGenerations = catalogGenerations.filter((generation) =>
      generationMatches(generation, record),
    );

    if (matchedGenerations.length === 0) {
      if (unmatchedRecords.length < maxUnmatchedRecords) {
        unmatchedRecords.push({
          campaignNumber: record.campaignNumber,
          make: record.make,
          model: record.model,
          modelYear: record.modelYear,
          component: record.component,
        });
      }
      continue;
    }

    matchedRecords++;
    const issue = createIssue(record);
    const existingIssue = issuesBySlug.get(issue.slug);
    if (existingIssue) {
      mergeIssue(existingIssue, issue);
    } else {
      issuesBySlug.set(issue.slug, issue);
    }

    for (const generation of matchedGenerations) {
      const key = `${issue.slug}|${generation.generationId}|${record.modelYear}`;
      const existingApplicability = applicabilityByKey.get(key);
      if (existingApplicability) {
        if (!existingApplicability.sourceRecordIds.includes(record.recordId)) {
          existingApplicability.sourceRecordIds.push(record.recordId);
        }
        continue;
      }

      applicabilityByKey.set(key, {
        issueSlug: issue.slug,
        campaignNumber: record.campaignNumber,
        generationId: generation.generationId,
        modelYearStart: record.modelYear,
        modelYearEnd: record.modelYear,
        marketCode: null,
        notes: applicabilityNotes(record, generation),
        sourceRecordIds: [record.recordId],
      });
    }
  }

  const issues = [...issuesBySlug.values()].sort((left, right) =>
    left.slug.localeCompare(right.slug),
  );
  const applicability = [...applicabilityByKey.values()].sort((left, right) =>
    `${left.issueSlug}|${left.generationId}|${left.modelYearStart}`.localeCompare(
      `${right.issueSlug}|${right.generationId}|${right.modelYearStart}`,
    ),
  );

  return {
    issues,
    applicability,
    unmatchedRecords,
    summary: {
      totalRecords: records.length,
      vehicleRecords: records.length,
      matchedRecords,
      unmatchedRecords: records.length - matchedRecords,
      issueCount: issues.length,
      campaignCount: new Set(issues.map((issue) => issue.campaignNumber)).size,
      applicabilityCount: applicability.length,
    },
  };
}
