import { createHash } from "node:crypto";

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

export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type IssueSystem =
  | "engine"
  | "transmission"
  | "electrical"
  | "suspension"
  | "brakes"
  | "body"
  | "interior"
  | "software"
  | "emissions"
  | "other";

export type ReliabilitySeedVehicle = {
  brandId: string;
  brand: string;
  modelId: string;
  model: string;
  generationId: string;
  generationName: string;
  generationCode: string | null;
  startsYear: number;
  endsYear: number | null;
  versionId: string;
  powertrainId: string | null;
  commercialName: string;
  trimName: string;
  bodyStyle: BodyStyle;
  marketCode: string;
  marketOrigin: string;
  availabilityScope: string;
  fiscalHp: number | null;
  seats: number | null;
  sourceConfidence: number;
  fuelType: string | null;
};

export type PlannedKnownIssue = {
  kind: "model_profile" | "generation_profile" | "targeted_quirk";
  templateKey: string;
  slug: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  affectedSystem: IssueSystem;
  typicalMileageMinKm: number | null;
  typicalMileageMaxKm: number | null;
  confidence: number;
  repair: PlannedRepairCost;
  scope: {
    modelId?: string;
    generationId?: string;
  };
};

export type PlannedIssueApplicability = {
  issueSlug: string;
  generationId: string | null;
  powertrainId: string | null;
  vehicleVersionId: string | null;
  modelYearStart: number | null;
  modelYearEnd: number | null;
  marketCode: string | null;
  notes: string;
};

export type PlannedRepairCost = {
  costMinMad: number | null;
  costMedianMad: number;
  costMaxMad: number | null;
  laborHoursMin: number | null;
  laborHoursMax: number | null;
  notes: string;
};

export type PlannedMaintenanceSchedule = {
  vehicleVersionId: string;
  generationId: string | null;
  powertrainId: string | null;
  intervalKm: number | null;
  intervalMonths: number | null;
  itemName: string;
  costMinMad: number | null;
  costMedianMad: number | null;
  costMaxMad: number | null;
  notes: string;
};

export type ReliabilitySeedPlan = {
  issues: PlannedKnownIssue[];
  applicability: PlannedIssueApplicability[];
  maintenanceSchedules: PlannedMaintenanceSchedule[];
  summary: {
    modelCount: number;
    generationCount: number;
    versionCount: number;
    issueCount: number;
    applicabilityCount: number;
    maintenanceScheduleCount: number;
  };
};

type ModelGroup = {
  brandId: string;
  brand: string;
  modelId: string;
  model: string;
  generations: Map<string, GenerationGroup>;
};

type GenerationGroup = {
  generationId: string;
  generationName: string;
  generationCode: string | null;
  startsYear: number;
  endsYear: number | null;
  bodyStyles: Set<BodyStyle>;
  marketCodes: Set<string>;
  marketOrigins: Set<string>;
  availabilityScopes: Set<string>;
  fuelTypes: Set<InferredFuel>;
  versions: ReliabilitySeedVehicle[];
  sourceConfidenceMin: number;
};

type InferredFuel = "gasoline" | "diesel" | "hybrid" | "electric" | "other";

type QuirkTemplate = {
  key: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  affectedSystem: IssueSystem;
  typicalMileageMinKm: number | null;
  typicalMileageMaxKm: number | null;
  confidence: number;
  repair: PlannedRepairCost;
};

const slugPrefix = "carsablanca-reliability-baseline-";
const baselineYear = 2026;

const premiumBrands = new Set([
  "Abarth",
  "Alfa Romeo",
  "Alpine",
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "Cupra",
  "DS",
  "Jaguar",
  "Land Rover",
  "Lexus",
  "Maserati",
  "Mercedes-Benz",
  "MINI",
  "Porsche",
  "Tesla",
  "Volvo",
]);

const highPartsAvailabilityBrands = new Set([
  "Citroen",
  "Citroën",
  "Dacia",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Kia",
  "Nissan",
  "Opel",
  "Peugeot",
  "Renault",
  "Seat",
  "Skoda",
  "ŠKODA",
  "Toyota",
  "Volkswagen",
]);

const quirkTemplates: Record<string, QuirkTemplate> = {
  "diesel-injection-emissions": {
    key: "diesel-injection-emissions",
    title: "Diesel injection and emissions system watch",
    description:
      "Baseline diesel reliability check: verify injector noise, smoke, cold starts, DPF/EGR behavior where equipped, and documented fuel-filter service before ranking this as a low-risk buy.",
    severity: "medium",
    affectedSystem: "emissions",
    typicalMileageMinKm: 90000,
    typicalMileageMaxKm: 220000,
    confidence: 0.46,
    repair: {
      costMinMad: 1800,
      costMedianMad: 6500,
      costMaxMad: 18000,
      laborHoursMin: 2,
      laborHoursMax: 10,
      notes: "Baseline Morocco diesel diagnostic/repair band; verify against sourced issue data.",
    },
  },
  "hybrid-battery-electronics": {
    key: "hybrid-battery-electronics",
    title: "Hybrid battery and power electronics check",
    description:
      "Baseline hybrid ownership quirk: verify hybrid battery state of health, inverter cooling, dashboard warnings, and dealer diagnostic history before treating the car as low risk.",
    severity: "medium",
    affectedSystem: "electrical",
    typicalMileageMinKm: 80000,
    typicalMileageMaxKm: 180000,
    confidence: 0.44,
    repair: {
      costMinMad: 2500,
      costMedianMad: 9500,
      costMaxMad: 30000,
      laborHoursMin: 2,
      laborHoursMax: 12,
      notes: "Baseline hybrid diagnostic/repair band; not a model-specific failure rate.",
    },
  },
  "electric-battery-software": {
    key: "electric-battery-software",
    title: "EV battery, charging, and software baseline check",
    description:
      "Baseline EV reliability check: confirm battery state of health, charging-port behavior, service-campaign status, and software update history before scoring reliability highly.",
    severity: "medium",
    affectedSystem: "electrical",
    typicalMileageMinKm: 50000,
    typicalMileageMaxKm: 160000,
    confidence: 0.42,
    repair: {
      costMinMad: 2000,
      costMedianMad: 12000,
      costMaxMad: 45000,
      laborHoursMin: 1.5,
      laborHoursMax: 14,
      notes: "Baseline EV diagnostic/repair band; battery replacement costs require sourced model data.",
    },
  },
  "older-generation-wear": {
    key: "older-generation-wear",
    title: "Age-related suspension, cooling, and seal wear",
    description:
      "Baseline age quirk for older generations: inspect suspension bushings, cooling hoses, oil leaks, mounts, door seals, and service gaps because age can dominate model reputation.",
    severity: "medium",
    affectedSystem: "suspension",
    typicalMileageMinKm: 90000,
    typicalMileageMaxKm: 240000,
    confidence: 0.5,
    repair: {
      costMinMad: 1200,
      costMedianMad: 5200,
      costMaxMad: 15000,
      laborHoursMin: 2,
      laborHoursMax: 12,
      notes: "Baseline age-wear band for used/import candidates.",
    },
  },
  "import-provenance-parts": {
    key: "import-provenance-parts",
    title: "Import provenance and parts compatibility check",
    description:
      "Baseline import-market quirk: verify VIN provenance, customs paperwork, accident history, mileage consistency, local parts compatibility, and diagnostic support.",
    severity: "medium",
    affectedSystem: "other",
    typicalMileageMinKm: null,
    typicalMileageMaxKm: null,
    confidence: 0.48,
    repair: {
      costMinMad: 500,
      costMedianMad: 2500,
      costMaxMad: 9000,
      laborHoursMin: 1,
      laborHoursMax: 5,
      notes: "Baseline pre-purchase inspection and paperwork-risk band.",
    },
  },
  "premium-electronics-suspension": {
    key: "premium-electronics-suspension",
    title: "Premium electronics and suspension cost exposure",
    description:
      "Baseline premium-brand quirk: check adaptive suspension, infotainment modules, sensors, comfort features, and specialist service access because repair cost exposure is higher.",
    severity: "medium",
    affectedSystem: "electrical",
    typicalMileageMinKm: 70000,
    typicalMileageMaxKm: 170000,
    confidence: 0.45,
    repair: {
      costMinMad: 2500,
      costMedianMad: 11000,
      costMaxMad: 35000,
      laborHoursMin: 2,
      laborHoursMax: 16,
      notes: "Baseline premium diagnostics/repair band.",
    },
  },
  "suv-suspension-tire-wear": {
    key: "suv-suspension-tire-wear",
    title: "SUV suspension, tire, and brake wear check",
    description:
      "Baseline SUV/crossover quirk: inspect tire wear pattern, wheel alignment, suspension joints, brakes, and underbody condition, especially for rough-road use.",
    severity: "low",
    affectedSystem: "suspension",
    typicalMileageMinKm: 50000,
    typicalMileageMaxKm: 150000,
    confidence: 0.47,
    repair: {
      costMinMad: 1200,
      costMedianMad: 4200,
      costMaxMad: 12000,
      laborHoursMin: 1.5,
      laborHoursMax: 8,
      notes: "Baseline SUV wear inspection band.",
    },
  },
  "city-car-clutch-suspension": {
    key: "city-car-clutch-suspension",
    title: "City-use clutch, brake, and suspension wear",
    description:
      "Baseline city-car quirk: inspect clutch take-up, brake wear, wheel bearings, and front suspension because stop-start urban use can hide behind low mileage.",
    severity: "low",
    affectedSystem: "brakes",
    typicalMileageMinKm: 60000,
    typicalMileageMaxKm: 160000,
    confidence: 0.46,
    repair: {
      costMinMad: 900,
      costMedianMad: 3200,
      costMaxMad: 9000,
      laborHoursMin: 1,
      laborHoursMax: 7,
      notes: "Baseline urban-use wear band.",
    },
  },
  "parts-availability-validation": {
    key: "parts-availability-validation",
    title: "Parts availability and dealer coverage validation",
    description:
      "Baseline market-support quirk: confirm local dealer coverage, consumable parts, body panels, electronic modules, and independent specialist availability before promising low ownership risk.",
    severity: "low",
    affectedSystem: "other",
    typicalMileageMinKm: null,
    typicalMileageMaxKm: null,
    confidence: 0.43,
    repair: {
      costMinMad: 300,
      costMedianMad: 1800,
      costMaxMad: 7000,
      laborHoursMin: 0.5,
      laborHoursMax: 4,
      notes: "Baseline availability check; convert to sourced parts score later.",
    },
  },
  "low-source-confidence": {
    key: "low-source-confidence",
    title: "Low catalog confidence reliability review",
    description:
      "Baseline data-quality quirk: this generation has low catalog confidence, so reliability ranking should require cross-source validation before being shown as a strong recommendation.",
    severity: "low",
    affectedSystem: "other",
    typicalMileageMinKm: null,
    typicalMileageMaxKm: null,
    confidence: 0.35,
    repair: {
      costMinMad: 0,
      costMedianMad: 500,
      costMaxMad: 1500,
      laborHoursMin: 0.5,
      laborHoursMax: 2,
      notes: "Baseline data validation effort, not a mechanical repair.",
    },
  },
};

export function createReliabilitySeedPlan(
  vehicles: ReliabilitySeedVehicle[],
): ReliabilitySeedPlan {
  const sortedVehicles = [...vehicles].sort(vehicleSort);
  const models = groupModels(sortedVehicles);
  const issuesBySlug = new Map<string, PlannedKnownIssue>();
  const applicability: PlannedIssueApplicability[] = [];
  const maintenanceSchedules: PlannedMaintenanceSchedule[] = [];

  for (const model of [...models.values()].sort(modelSort)) {
    const modelIssue = makeModelProfileIssue(model);
    addIssue(issuesBySlug, modelIssue);

    for (const generation of [...model.generations.values()].sort(generationSort)) {
      applicability.push(makeGenerationApplicability(modelIssue, generation, "Model-level baseline profile."));

      const generationIssue = makeGenerationProfileIssue(model, generation);
      addIssue(issuesBySlug, generationIssue);
      applicability.push(
        makeGenerationApplicability(generationIssue, generation, "Generation-level baseline profile."),
      );

      for (const templateKey of targetedTemplateKeys(model, generation)) {
        const issue = makeTargetedIssue(model, generation, quirkTemplates[templateKey]);
        addIssue(issuesBySlug, issue);
        applicability.push(
          makeGenerationApplicability(issue, generation, "Generated from catalog attributes."),
        );
      }
    }
  }

  for (const vehicle of sortedVehicles) {
    maintenanceSchedules.push(...maintenanceForVersion(vehicle));
  }

  const issues = [...issuesBySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    issues,
    applicability: applicability.sort(applicabilitySort),
    maintenanceSchedules: maintenanceSchedules.sort(maintenanceSort),
    summary: {
      modelCount: models.size,
      generationCount: [...models.values()].reduce(
        (count, model) => count + model.generations.size,
        0,
      ),
      versionCount: sortedVehicles.length,
      issueCount: issues.length,
      applicabilityCount: applicability.length,
      maintenanceScheduleCount: maintenanceSchedules.length,
    },
  };
}

function groupModels(vehicles: ReliabilitySeedVehicle[]) {
  const models = new Map<string, ModelGroup>();

  for (const vehicle of vehicles) {
    let model = models.get(vehicle.modelId);
    if (!model) {
      model = {
        brandId: vehicle.brandId,
        brand: vehicle.brand,
        modelId: vehicle.modelId,
        model: vehicle.model,
        generations: new Map<string, GenerationGroup>(),
      };
      models.set(vehicle.modelId, model);
    }

    let generation = model.generations.get(vehicle.generationId);
    if (!generation) {
      generation = {
        generationId: vehicle.generationId,
        generationName: vehicle.generationName,
        generationCode: vehicle.generationCode,
        startsYear: vehicle.startsYear,
        endsYear: vehicle.endsYear,
        bodyStyles: new Set(),
        marketCodes: new Set(),
        marketOrigins: new Set(),
        availabilityScopes: new Set(),
        fuelTypes: new Set(),
        versions: [],
        sourceConfidenceMin: vehicle.sourceConfidence,
      };
      model.generations.set(vehicle.generationId, generation);
    }

    generation.startsYear = Math.min(generation.startsYear, vehicle.startsYear);
    generation.endsYear = maxNullableYear(generation.endsYear, vehicle.endsYear);
    generation.bodyStyles.add(vehicle.bodyStyle);
    generation.marketCodes.add(vehicle.marketCode);
    generation.marketOrigins.add(vehicle.marketOrigin);
    generation.availabilityScopes.add(vehicle.availabilityScope);
    generation.fuelTypes.add(inferFuel(vehicle));
    generation.versions.push(vehicle);
    generation.sourceConfidenceMin = Math.min(generation.sourceConfidenceMin, vehicle.sourceConfidence);
  }

  return models;
}

function makeModelProfileIssue(model: ModelGroup): PlannedKnownIssue {
  const generationCount = model.generations.size;
  const slug = scopedSlug(["model-profile", model.modelId, model.brand, model.model]);

  return {
    kind: "model_profile",
    templateKey: "model-baseline-profile",
    slug,
    title: `Baseline reliability profile: ${model.brand} ${model.model}`,
    description:
      `Baseline model profile for ${model.brand} ${model.model}. ` +
      `Covers ${generationCount} catalog generation${generationCount === 1 ? "" : "s"} and should be treated as a seeded inspection scaffold, not a sourced defect claim.`,
    severity: "low",
    affectedSystem: "other",
    typicalMileageMinKm: null,
    typicalMileageMaxKm: null,
    confidence: 0.4,
    repair: {
      costMinMad: 0,
      costMedianMad: 600,
      costMaxMad: 2000,
      laborHoursMin: 0.5,
      laborHoursMax: 2,
      notes: "Model profile verification band.",
    },
    scope: { modelId: model.modelId },
  };
}

function makeGenerationProfileIssue(
  model: ModelGroup,
  generation: GenerationGroup,
): PlannedKnownIssue {
  const yearRange = generation.endsYear
    ? `${generation.startsYear}-${generation.endsYear}`
    : `${generation.startsYear}+`;
  const slug = scopedSlug([
    "generation-profile",
    generation.generationId,
    model.brand,
    model.model,
    generation.generationName,
  ]);

  return {
    kind: "generation_profile",
    templateKey: "generation-baseline-profile",
    slug,
    title: `Ownership quirks baseline: ${model.brand} ${model.model} ${generation.generationName}`,
    description:
      `Baseline generation profile for ${model.brand} ${model.model} ${generation.generationName} (${yearRange}). ` +
      "Use it to attach sourced known issues later; current content is a deterministic inspection scaffold.",
    severity: "low",
    affectedSystem: "other",
    typicalMileageMinKm: 60000,
    typicalMileageMaxKm: 180000,
    confidence: Math.max(0.3, Math.min(0.55, generation.sourceConfidenceMin)),
    repair: {
      costMinMad: 500,
      costMedianMad: 1500,
      costMaxMad: 4500,
      laborHoursMin: 1,
      laborHoursMax: 4,
      notes: "Generation baseline inspection band.",
    },
    scope: { modelId: model.modelId, generationId: generation.generationId },
  };
}

function makeTargetedIssue(
  model: ModelGroup,
  generation: GenerationGroup,
  template: QuirkTemplate,
): PlannedKnownIssue {
  const slug = scopedSlug([
    "targeted",
    template.key,
    generation.generationId,
    model.brand,
    model.model,
  ]);

  return {
    kind: "targeted_quirk",
    templateKey: template.key,
    slug,
    title: `${template.title}: ${model.brand} ${model.model} ${generation.generationName}`,
    description:
      `${template.description} Applies to ${model.brand} ${model.model} ${generation.generationName} based on current catalog attributes.`,
    severity: template.severity,
    affectedSystem: template.affectedSystem,
    typicalMileageMinKm: template.typicalMileageMinKm,
    typicalMileageMaxKm: template.typicalMileageMaxKm,
    confidence: template.confidence,
    repair: template.repair,
    scope: { modelId: model.modelId, generationId: generation.generationId },
  };
}

function makeGenerationApplicability(
  issue: PlannedKnownIssue,
  generation: GenerationGroup,
  notePrefix: string,
): PlannedIssueApplicability {
  return {
    issueSlug: issue.slug,
    generationId: generation.generationId,
    powertrainId: null,
    vehicleVersionId: null,
    modelYearStart: generation.startsYear,
    modelYearEnd: generation.endsYear,
    marketCode: joinSet(generation.marketCodes),
    notes:
      `${notePrefix} Seeded by Carsablanca reliability baseline; verify with sourced model/generation evidence before user-facing reliability claims.`,
  };
}

function targetedTemplateKeys(model: ModelGroup, generation: GenerationGroup) {
  const keys = new Set<string>();
  const age = baselineYear - generation.startsYear;

  if (generation.fuelTypes.has("diesel")) keys.add("diesel-injection-emissions");
  if (generation.fuelTypes.has("hybrid")) keys.add("hybrid-battery-electronics");
  if (generation.fuelTypes.has("electric")) keys.add("electric-battery-software");
  if (age >= 10 || (generation.endsYear !== null && generation.endsYear <= baselineYear - 7)) {
    keys.add("older-generation-wear");
  }
  if (
    generation.marketOrigins.has("morocco_used_import") ||
    generation.marketOrigins.has("unknown_import") ||
    generation.availabilityScopes.has("imported_edge_case")
  ) {
    keys.add("import-provenance-parts");
  }
  if (premiumBrands.has(model.brand)) keys.add("premium-electronics-suspension");
  if (generation.bodyStyles.has("suv") || generation.bodyStyles.has("crossover")) {
    keys.add("suv-suspension-tire-wear");
  }
  if (generation.bodyStyles.has("hatchback")) keys.add("city-car-clutch-suspension");
  if (!highPartsAvailabilityBrands.has(model.brand)) keys.add("parts-availability-validation");
  if (generation.sourceConfidenceMin < 0.4) keys.add("low-source-confidence");

  return [...keys].sort();
}

function maintenanceForVersion(vehicle: ReliabilitySeedVehicle): PlannedMaintenanceSchedule[] {
  const fuel = inferFuel(vehicle);
  const schedules: PlannedMaintenanceSchedule[] = [
    makeSchedule(vehicle, {
      itemName: "Annual reliability and safety inspection",
      intervalKm: 12000,
      intervalMonths: 12,
      costMinMad: 400,
      costMedianMad: 800,
      costMaxMad: 1500,
      notes: "Baseline annual inspection: scan faults, check leaks, suspension, brakes, tires, lights, fluids, and service history.",
    }),
    makeSchedule(vehicle, {
      itemName: "Brake fluid, coolant, and belt inspection",
      intervalKm: 30000,
      intervalMonths: 24,
      costMinMad: 600,
      costMedianMad: 1400,
      costMaxMad: 3200,
      notes: "Baseline reliability service for consumables that often drive avoidable failures.",
    }),
    makeSchedule(vehicle, {
      itemName: "Major wear inspection",
      intervalKm: 60000,
      intervalMonths: 48,
      costMinMad: 1200,
      costMedianMad: 3500,
      costMaxMad: 9000,
      notes: "Baseline major inspection: suspension, mounts, cooling, steering, drivetrain, and electronic diagnostics.",
    }),
  ];

  if (fuel === "electric") {
    schedules.push(
      makeSchedule(vehicle, {
        itemName: "EV battery health and charging diagnostic",
        intervalKm: 20000,
        intervalMonths: 12,
        costMinMad: 500,
        costMedianMad: 1200,
        costMaxMad: 3000,
        notes: "Baseline EV diagnostic: battery state of health, charging port, thermal management, software campaigns, and brake regeneration.",
      }),
    );
  } else if (fuel === "hybrid") {
    schedules.push(
      makeSchedule(vehicle, {
        itemName: "Hybrid battery and inverter diagnostic",
        intervalKm: 20000,
        intervalMonths: 12,
        costMinMad: 600,
        costMedianMad: 1400,
        costMaxMad: 3500,
        notes: "Baseline hybrid diagnostic: battery state, inverter cooling, fault scan, and engine/electric transition behavior.",
      }),
    );
  } else {
    schedules.push(
      makeSchedule(vehicle, {
        itemName: "Engine oil and filter service",
        intervalKm: fuel === "diesel" ? 10000 : 12000,
        intervalMonths: 12,
        costMinMad: fuel === "diesel" ? 600 : 450,
        costMedianMad: fuel === "diesel" ? 1100 : 850,
        costMaxMad: fuel === "diesel" ? 2200 : 1800,
        notes: "Baseline combustion service interval; adjust for manufacturer schedule and Moroccan usage.",
      }),
    );
  }

  if (fuel === "diesel") {
    schedules.push(
      makeSchedule(vehicle, {
        itemName: "Diesel fuel filter and emissions check",
        intervalKm: 20000,
        intervalMonths: 12,
        costMinMad: 500,
        costMedianMad: 1300,
        costMaxMad: 3000,
        notes: "Baseline diesel reliability service: fuel filter, injector behavior, smoke, EGR/DPF where equipped.",
      }),
    );
  }

  return schedules;
}

function makeSchedule(
  vehicle: ReliabilitySeedVehicle,
  input: Omit<PlannedMaintenanceSchedule, "vehicleVersionId" | "generationId" | "powertrainId">,
): PlannedMaintenanceSchedule {
  return {
    vehicleVersionId: vehicle.versionId,
    generationId: vehicle.generationId,
    powertrainId: vehicle.powertrainId,
    ...input,
  };
}

function inferFuel(vehicle: ReliabilitySeedVehicle): InferredFuel {
  if (vehicle.fuelType) {
    const normalizedFuel = normalizeText(vehicle.fuelType);
    if (normalizedFuel.includes("diesel")) return "diesel";
    if (normalizedFuel.includes("hybrid")) return "hybrid";
    if (normalizedFuel.includes("electric")) return "electric";
    if (normalizedFuel.includes("gasoline") || normalizedFuel.includes("essence")) return "gasoline";
  }

  const label = normalizeText(`${vehicle.commercialName} ${vehicle.trimName}`);
  if (/(electric|electrique|\bev\b|\bkwh\b|\bkw\b)/.test(label)) return "electric";
  if (/(hybrid|hev|phev|e-tech|e tech)/.test(label)) return "hybrid";
  if (/(dci|hdi|bluehdi|tdi|crdi|cdi|gasoil|diesel)/.test(label)) return "diesel";
  if (/(essence|tce|tsi|mpi|gdi|turbo|vti|puretech)/.test(label)) return "gasoline";
  return "other";
}

function addIssue(issuesBySlug: Map<string, PlannedKnownIssue>, issue: PlannedKnownIssue) {
  if (!issuesBySlug.has(issue.slug)) {
    issuesBySlug.set(issue.slug, issue);
  }
}

function scopedSlug(parts: string[]) {
  const digest = createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 10);
  const suffixLength = digest.length + 1;
  const readableMax = 220 - slugPrefix.length - suffixLength;
  const readable = slugify(parts.join("-")).slice(0, readableMax).replace(/-$/g, "");
  return `${slugPrefix}${readable}-${digest}`;
}

function slugify(value: string) {
  return normalizeText(value).replace(/\s+/g, "-").replace(/^-|-$/g, "") || "item";
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function joinSet(values: Set<string>) {
  const sorted = [...values].filter(Boolean).sort();
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  return sorted.join(",");
}

function maxNullableYear(left: number | null, right: number | null) {
  if (left === null) return right;
  if (right === null) return left;
  return Math.max(left, right);
}

function vehicleSort(left: ReliabilitySeedVehicle, right: ReliabilitySeedVehicle) {
  return (
    left.brand.localeCompare(right.brand) ||
    left.model.localeCompare(right.model) ||
    left.generationName.localeCompare(right.generationName) ||
    left.commercialName.localeCompare(right.commercialName) ||
    left.trimName.localeCompare(right.trimName) ||
    left.versionId.localeCompare(right.versionId)
  );
}

function modelSort(left: ModelGroup, right: ModelGroup) {
  return left.brand.localeCompare(right.brand) || left.model.localeCompare(right.model);
}

function generationSort(left: GenerationGroup, right: GenerationGroup) {
  return (
    left.startsYear - right.startsYear ||
    left.generationName.localeCompare(right.generationName) ||
    left.generationId.localeCompare(right.generationId)
  );
}

function applicabilitySort(left: PlannedIssueApplicability, right: PlannedIssueApplicability) {
  return (
    left.issueSlug.localeCompare(right.issueSlug) ||
    (left.generationId ?? "").localeCompare(right.generationId ?? "") ||
    (left.vehicleVersionId ?? "").localeCompare(right.vehicleVersionId ?? "")
  );
}

function maintenanceSort(
  left: PlannedMaintenanceSchedule,
  right: PlannedMaintenanceSchedule,
) {
  return (
    left.vehicleVersionId.localeCompare(right.vehicleVersionId) ||
    left.itemName.localeCompare(right.itemName)
  );
}
