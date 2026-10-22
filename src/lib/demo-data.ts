// Synthetic DEMO data generator for Diop AI Research.
// IMPORTANT: All values here are SYNTHETIC and do NOT represent real clinical
// performance. They exist only for UI development and demonstration.
// A visible "DEMO MODE — Synthetic Research Data" banner is always shown when
// this data source is active.

import {
  AuditLog,
  DatasetRecord,
  ModelAlgorithm,
  ModelStatus,
  ModelVersion,
  OutcomeClass,
  ReportRecord,
  ResearchCase,
  STUDY_META,
  UserRecord,
} from "./types";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seeded(424242);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, dp = 1) {
  return parseFloat((rand() * (max - min) + min).toFixed(dp));
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const SITES = [
  "Maxilla Anterior",
  "Maxilla Premolar",
  "Maxilla Molar",
  "Mandible Anterior",
  "Mandible Premolar",
  "Mandible Molar",
] as const;
const SEXES = ["Male", "Female"] as const;
const QUALITIES = ["Excellent", "Adequate", "Suboptimal"] as const;
const BONE_TYPES = ["Type I", "Type II", "Type III", "Type IV"] as const;
const SMOKING = ["Non-smoker", "Former smoker", "Current smoker"] as const;
const DIABETES = ["None", "Controlled", "Uncontrolled"] as const;
const LOADING = ["Immediate", "Early", "Conventional"] as const;
const PROSTHETIC = ["Crown", "Bridge", "Overdenture"] as const;

// Deterministic pseudo-ML prediction: a weighted score from features that
// mimics an XGBoost probability output. NOT a real model.
export function pseudoPredict(features: {
  boneDensityHu: number | null;
  boneQuality: string | null;
  corticalBoneThickness: number | null;
  buccolingualWidth: number | null;
  apicocoronalHeight: number | null;
  smoking: string | null;
  diabetes: string | null;
  bruxism: boolean | null;
  implantLengthMm: number | null;
  loadingProtocol: string | null;
}): {
  predictedOutcome: OutcomeClass;
  probability: number;
  contributions: { feature: string; contribution: number }[];
} {
  let score = 0.5;
  const contributions: { feature: string; contribution: number }[] = [];

  function add(label: string, delta: number) {
    score += delta;
    contributions.push({ feature: label, contribution: delta });
  }

  if (features.boneDensityHu != null) {
    const v = (features.boneDensityHu - 500) / 1000; // ~ -0.5..1.5
    add("Bone Density (HU)", v * 0.18);
  }
  if (features.boneQuality) {
    const map: Record<string, number> = {
      "Type I": 0.12,
      "Type II": 0.1,
      "Type III": -0.04,
      "Type IV": -0.14,
    };
    add("Bone Quality", (map[features.boneQuality] ?? 0));
  }
  if (features.corticalBoneThickness != null) {
    add("Cortical Bone Thickness", ((features.corticalBoneThickness - 1.2) / 2) * 0.12);
  }
  if (features.buccolingualWidth != null) {
    add("Buccolingual Width", ((features.buccolingualWidth - 5) / 4) * 0.08);
  }
  if (features.apicocoronalHeight != null) {
    add("Apicocoronal Height", ((features.apicocoronalHeight - 9) / 5) * 0.08);
  }
  if (features.smoking) {
    add("Smoking Status", features.smoking === "Current smoker" ? -0.1 : 0.04);
  }
  if (features.diabetes) {
    add("Diabetes Status", features.diabetes === "Uncontrolled" ? -0.12 : 0.02);
  }
  if (features.bruxism != null) {
    add("Bruxism", features.bruxism ? -0.08 : 0.04);
  }
  if (features.implantLengthMm != null) {
    add("Implant Length", ((features.implantLengthMm - 10) / 4) * 0.06);
  }
  if (features.loadingProtocol) {
    add("Loading Protocol", features.loadingProtocol === "Immediate" ? -0.05 : 0.03);
  }

  const probability = Math.max(0.05, Math.min(0.97, score));
  const predictedOutcome: OutcomeClass = probability >= 0.5 ? "Success" : "Failure";
  // sort contributions by magnitude
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return { predictedOutcome, probability, contributions };
}

export function generateDemoCases(n = 128): ResearchCase[] {
  const cases: ResearchCase[] = [];
  for (let i = 0; i < n; i++) {
    const age = randInt(18, 80);
    const site = pick([...SITES]);
    const isMaxilla = site.startsWith("Maxilla");
    const cbctAvailable = rand() > 0.08;
    const quality = cbctAvailable ? pick([...QUALITIES]) : "Suboptimal";
    const boneDensity = randInt(300, 1100);
    const boneType = pick([...BONE_TYPES]);
    const bl = randFloat(3.5, 8.5, 1);
    const ac = randFloat(6, 14, 1);
    const cortical = randFloat(0.6, 2.6, 1);
    const smoking = pick([...SMOKING]);
    const diabetes = pick([...DIABETES]);
    const bruxism = rand() > 0.7;
    const implLength = randFloat(8, 13, 1);
    const implDia = randFloat(3.3, 5.0, 1);
    const loading = pick([...LOADING]);
    const prosthetic = pick([...PROSTHETIC]);
    const augmentation = rand() > 0.6;

    const pred = pseudoPredict({
      boneDensityHu: boneDensity,
      boneQuality: boneType,
      corticalBoneThickness: cortical,
      buccolingualWidth: bl,
      apicocoronalHeight: ac,
      smoking,
      diabetes,
      bruxism,
      implantLengthMm: implLength,
      loadingProtocol: loading,
    });

    // Documented outcome — only ~70% have documented outcomes (follow-up)
    const hasOutcome = rand() > 0.3;
    const documented: OutcomeClass | null = hasOutcome
      ? (rand() > 0.26 ? "Success" : "Failure")
      : null;
    const followUp = hasOutcome ? randInt(3, 36) : null;

    const eligibilityChecks = {
      "Age within approved study range": age >= 18 && age <= 80,
      "Preoperative CBCT available": cbctAvailable,
      "CBCT image quality adequate": quality !== "Suboptimal",
      "Implant site adequately visualized": cbctAvailable && quality !== "Suboptimal",
      "Clinical records complete": rand() > 0.15,
      "Documented implant outcome available": hasOutcome,
      "Adequate follow-up available": hasOutcome ? (followUp ?? 0) >= 6 : false,
    };
    const checksPass = Object.values(eligibilityChecks).filter(Boolean).length;
    const eligibility =
      checksPass >= 6 ? "Eligible" : checksPass >= 4 ? "Requires Review" : "Excluded";

    const createdDays = randInt(1, 220);
    const caseId = `RC-${String(1000 + i).padStart(4, "0")}`;

    cases.push({
      id: `case_${i}`,
      caseId,
      age,
      sex: pick([...SEXES]),
      implantSite: site,
      toothPosition: `#${randInt(11, 47)}`,
      cbctAvailable,
      cbctQuality: quality,
      eligibility,
      eligibilityChecks,
      cbct: {
        imageQualityScore: randInt(2, 5),
        boneDensityHu: boneDensity,
        boneQuality: boneType,
        buccolingualWidth: bl,
        apicocoronalHeight: ac,
        corticalBoneThickness: cortical,
        sinusFloorToCrest: isMaxilla ? randFloat(1, 12, 1) : null,
        distanceToIA: !isMaxilla ? randFloat(2, 14, 1) : null,
        buccalPlateThickness: randFloat(0.4, 2.0, 1),
        interradicularBone: rand() > 0.4 ? randFloat(1.5, 4.0, 1) : null,
        source: "Manual entry",
        assessmentStatus: rand() > 0.2 ? "Entered" : "Partial",
      },
      clinical: {
        smokingStatus: smoking,
        diabetesStatus: diabetes,
        bruxism,
        implantSystem: pick(["System A", "System B", "System C"]),
        implantDiameterMm: implDia,
        implantLengthMm: implLength,
        loadingProtocol: loading,
        prostheticType: prosthetic,
        augmentationPerformed: augmentation,
        additionalVariables: [
          { label: "Periodontitis History", value: pick(["Yes", "No", "Unknown"]) },
        ],
      },
      outcome: hasOutcome
        ? {
            documentedOutcome: documented,
            followUpMonths: followUp,
            assessmentDate: isoDaysAgo(randInt(5, 120)),
            classificationSource: "Research protocol definition (configurable)",
            notes: documented === "Failure" ? "Configurable outcome criteria applied." : "",
          }
        : null,
      prediction: {
        modelId: "model_xgb_v1",
        modelVersion: "1.0",
        algorithm: "XGBoost",
        predictedOutcome: pred.predictedOutcome,
        probability: parseFloat(pred.probability.toFixed(3)),
        featureContributions: pred.contributions,
        shapAvailable: true,
        generatedAt: isoDaysAgo(randInt(0, 20)),
        status: "Completed",
      },
      status: rand() > 0.1 ? "Active" : rand() > 0.5 ? "Draft" : "Archived",
      createdBy: pick(["Dr. A. Researcher", "Dr. B. Analyst", "Dr. C. Resident"]),
      createdAt: isoDaysAgo(createdDays),
      updatedAt: isoDaysAgo(randInt(0, createdDays)),
    });
  }
  return cases.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

// ROC-like curve generator
function rocFromAuc(auc: number) {
  const pts: { fpr: number; tpr: number }[] = [];
  for (let i = 0; i <= 40; i++) {
    const fpr = i / 40;
    const tpr = Math.min(1, Math.max(fpr, 1 - Math.pow(1 - fpr, 1 / (auc / (1 - 0.5 + 1e-9)))));
    pts.push({ fpr, tpr: parseFloat(tpr.toFixed(3)) });
  }
  // ensure endpoint
  pts[pts.length - 1] = { fpr: 1, tpr: 1 };
  pts[0] = { fpr: 0, tpr: 0 };
  return pts;
}

export function generateDemoModels(): ModelVersion[] {
  return [
    {
      id: "model_xgb_v1",
      version: "1.0",
      algorithm: "XGBoost",
      status: "Validated",
      trainingDatasetVersion: "dataset_v1 (128 records, synthetic)",
      featureList: [
        "Bone Density (HU)",
        "Bone Quality",
        "Cortical Bone Thickness",
        "Buccolingual Width",
        "Apicocoronal Height",
        "Smoking Status",
        "Diabetes Status",
        "Bruxism",
        "Implant Length",
        "Loading Protocol",
      ],
      trainedAt: isoDaysAgo(14),
      validationStrategy: "5-fold stratified cross-validation (research protocol configurable)",
      rocAuc: 0.82,
      metrics: {
        accuracy: 0.81,
        sensitivity: 0.78,
        specificity: 0.83,
        precision: 0.76,
        f1: 0.77,
        rocAuc: 0.82,
        confusionMatrix: { tp: 62, fp: 13, fn: 17, tn: 63 },
        rocCurve: rocFromAuc(0.82),
        prCurve: [
          { recall: 0, precision: 0.5 },
          { recall: 0.3, precision: 0.74 },
          { recall: 0.6, precision: 0.7 },
          { recall: 0.8, precision: 0.6 },
          { recall: 1, precision: 0.42 },
        ],
        calibration: [
          { predicted: 0.1, actual: 0.12 },
          { predicted: 0.3, actual: 0.27 },
          { predicted: 0.5, actual: 0.52 },
          { predicted: 0.7, actual: 0.68 },
          { predicted: 0.9, actual: 0.86 },
        ],
      },
      fileLocation: "/models/model_xgb_v1.joblib (demo path)",
    },
    {
      id: "model_rf_v1",
      version: "1.0",
      algorithm: "Random Forest",
      status: "Development",
      trainingDatasetVersion: "dataset_v1 (128 records, synthetic)",
      featureList: [
        "Bone Density (HU)",
        "Bone Quality",
        "Cortical Bone Thickness",
        "Smoking Status",
        "Diabetes Status",
      ],
      trainedAt: isoDaysAgo(7),
      validationStrategy: "5-fold stratified cross-validation (demo)",
      rocAuc: 0.77,
      metrics: {
        accuracy: 0.76,
        sensitivity: 0.72,
        specificity: 0.79,
        precision: 0.7,
        f1: 0.71,
        rocAuc: 0.77,
        confusionMatrix: { tp: 58, fp: 15, fn: 21, tn: 61 },
        rocCurve: rocFromAuc(0.77),
        prCurve: [
          { recall: 0, precision: 0.5 },
          { recall: 0.4, precision: 0.68 },
          { recall: 0.7, precision: 0.58 },
          { recall: 1, precision: 0.4 },
        ],
        calibration: [
          { predicted: 0.2, actual: 0.25 },
          { predicted: 0.5, actual: 0.55 },
          { predicted: 0.8, actual: 0.74 },
        ],
      },
      fileLocation: "/models/model_rf_v1.joblib (demo path)",
    },
    {
      id: "model_lr_v1",
      version: "1.0",
      algorithm: "Logistic Regression",
      status: "Development",
      trainingDatasetVersion: "dataset_v1 (128 records, synthetic)",
      featureList: [
        "Bone Density (HU)",
        "Cortical Bone Thickness",
        "Smoking Status",
        "Diabetes Status",
      ],
      trainedAt: isoDaysAgo(3),
      validationStrategy: "5-fold stratified cross-validation (demo)",
      rocAuc: 0.71,
      metrics: {
        accuracy: 0.71,
        sensitivity: 0.66,
        specificity: 0.75,
        precision: 0.64,
        f1: 0.65,
        rocAuc: 0.71,
        confusionMatrix: { tp: 53, fp: 18, fn: 26, tn: 58 },
        rocCurve: rocFromAuc(0.71),
        prCurve: [
          { recall: 0, precision: 0.5 },
          { recall: 0.5, precision: 0.6 },
          { recall: 1, precision: 0.38 },
        ],
        calibration: [
          { predicted: 0.3, actual: 0.35 },
          { predicted: 0.6, actual: 0.58 },
        ],
      },
      fileLocation: "/models/model_lr_v1.joblib (demo path)",
    },
  ];
}

export function generateDemoDatasets(): DatasetRecord[] {
  return [
    {
      id: "ds_1",
      name: "retrospective_implant_v1.csv",
      records: 128,
      eligible: 112,
      excluded: 16,
      missingValues: 9,
      duplicates: 2,
      invalidValues: 3,
      qualityScore: 88,
      status: "Validated",
      importedAt: isoDaysAgo(14),
    },
    {
      id: "ds_2",
      name: "cohort_pilot_2023.xlsx",
      records: 64,
      eligible: 48,
      excluded: 16,
      missingValues: 14,
      duplicates: 4,
      invalidValues: 6,
      qualityScore: 71,
      status: "Needs Review",
      importedAt: isoDaysAgo(40),
    },
  ];
}

export function generateDemoAuditLogs(n = 40): AuditLog[] {
  const users = ["Dr. A. Researcher", "Dr. B. Analyst", "Admin", "Dr. C. Resident"];
  const actions = [
    { action: "Created research case", module: "Research Cases" },
    { action: "Updated CBCT feature", module: "CBCT Features" },
    { action: "Imported dataset", module: "Dataset" },
    { action: "Generated prediction", module: "Predictions" },
    { action: "Exported report", module: "Reports" },
    { action: "Updated outcome", module: "Outcomes" },
    { action: "Login", module: "Auth" },
    { action: "Trained model", module: "ML Pipeline" },
    { action: "Deleted dataset", module: "Dataset" },
    { action: "Updated eligibility", module: "Eligibility" },
  ];
  const logs: AuditLog[] = [];
  for (let i = 0; i < n; i++) {
    const a = pick(actions);
    logs.push({
      id: `log_${i}`,
      timestamp: isoDaysAgo(randInt(0, 30)) ,
      user: pick(users),
      action: a.action,
      module: a.module,
      caseId: rand() > 0.4 ? `RC-${String(1000 + randInt(0, 127)).padStart(4, "0")}` : null,
      status: rand() > 0.12 ? "Success" : rand() > 0.5 ? "Warning" : "Error",
      detail: a.action + " — synthetic audit entry.",
    });
  }
  return logs.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

export function generateDemoUsers(): UserRecord[] {
  return [
    {
      id: "u_1",
      name: "Dr. A. Researcher",
      email: "a.researcher@diop-ai.research",
      role: "Admin",
      status: "Active",
      lastLogin: isoDaysAgo(0),
      createdAt: isoDaysAgo(120),
    },
    {
      id: "u_2",
      name: "Dr. B. Analyst",
      email: "b.analyst@diop-ai.research",
      role: "Researcher",
      status: "Active",
      lastLogin: isoDaysAgo(1),
      createdAt: isoDaysAgo(90),
    },
    {
      id: "u_3",
      name: "Dr. C. Resident",
      email: "c.resident@diop-ai.research",
      role: "Researcher",
      status: "Active",
      lastLogin: isoDaysAgo(4),
      createdAt: isoDaysAgo(45),
    },
    {
      id: "u_4",
      name: "Dr. D. Supervisor",
      email: "d.supervisor@diop-ai.research",
      role: "Researcher",
      status: "Suspended",
      lastLogin: isoDaysAgo(30),
      createdAt: isoDaysAgo(200),
    },
  ];
}

export function generateDemoReports(): ReportRecord[] {
  return [
    {
      id: "r_1",
      type: "Study Dataset Summary",
      generatedBy: "Dr. A. Researcher",
      generatedAt: isoDaysAgo(2),
      format: "PDF",
      records: 128,
      status: "Ready",
    },
    {
      id: "r_2",
      type: "Model Performance Report",
      generatedBy: "Dr. B. Analyst",
      generatedAt: isoDaysAgo(5),
      format: "PDF",
      records: 3,
      status: "Ready",
    },
    {
      id: "r_3",
      type: "Data Quality Report",
      generatedBy: "Dr. A. Researcher",
      generatedAt: isoDaysAgo(7),
      format: "Excel",
      records: 128,
      status: "Ready",
    },
    {
      id: "r_4",
      type: "Final Research Summary",
      generatedBy: "Dr. A. Researcher",
      generatedAt: isoDaysAgo(1),
      format: "PDF",
      records: 0,
      status: "Generating",
    },
  ];
}

export const DEMO_STATS = {
  totalCases: 128,
  eligibleCases: 112,
  predictionsGenerated: 96,
  currentModel: "XGBoost v1.0",
  datasets: 2,
  users: 4,
  reports: 4,
};

export { STUDY_META };
