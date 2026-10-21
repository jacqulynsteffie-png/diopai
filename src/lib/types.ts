// Core domain types for the Diop AI Research platform.
// IMPORTANT: This is a RESEARCH platform. All data is de-identified.
// Fields not defined in the research protocol are marked as configurable
// "To be defined in research protocol" and use the RESEARCH_PROTOCOL_TBD sentinel.

export const RESEARCH_PROTOCOL_TBD = "To be defined in research protocol" as const;

// --- Research protocol metadata (sourced from the approved IRB application) ---
export const STUDY_META = {
  title:
    "Evaluation of an Artificial Intelligence-Based Predictive Model for Dental Implant Outcomes Based on Preoperative CBCT-Derived Features: A Retrospective Study",
  shortTitle: "AI Predictive Model for Dental Implant Outcomes",
  subtitle: "AI-Powered Dental Implant Outcome Research Platform",
  design: "Retrospective study",
  sponsor: "Research Institution (configurable)",
  principalInvestigator: "To be configured in research protocol",
  protocolVersion: "v1.0",
  dataMode: "DEMO" as "DEMO" | "PRODUCTION",
  disclaimer:
    "This prediction is intended for research evaluation and does not replace professional clinical assessment or treatment planning.",
} as const;

// --- Enums (labels are configurable via Research Configuration; defaults shown) ---
export type Sex = "Male" | "Female";
export type ImplantSite =
  | "Maxilla Anterior"
  | "Maxilla Premolar"
  | "Maxilla Molar"
  | "Mandible Anterior"
  | "Mandible Premolar"
  | "Mandible Molar";
export type CbctQuality = "Excellent" | "Adequate" | "Suboptimal";
export type EligibilityStatus = "Eligible" | "Requires Review" | "Excluded";
export type BoneQualityType = "Type I" | "Type II" | "Type III" | "Type IV";
export type PredictionStatus = "Pending" | "Completed" | "Not Available";
export type CaseStatus = "Draft" | "Active" | "Archived";
export type ModelStatus = "Validated" | "Development" | "Not Available";
export type ModelAlgorithm = "Logistic Regression" | "Random Forest" | "XGBoost";
export type UserRole = "Admin" | "Researcher";

// Outcome classification. The exact outcome definition must come from the research
// protocol. Defaults here are configurable placeholders shown as "Success/Failure".
export type OutcomeClass = "Success" | "Failure";

export interface ResearchCase {
  id: string;
  caseId: string; // de-identified research case ID
  age: number;
  sex: Sex;
  implantSite: ImplantSite;
  toothPosition: string; // configurable, e.g. FDDI notation
  cbctAvailable: boolean;
  cbctQuality: CbctQuality;
  eligibility: EligibilityStatus;
  eligibilityChecks: Record<string, boolean>;
  cbct: CbctFeatures;
  clinical: ClinicalFeatures;
  outcome: OutcomeRecord | null;
  prediction: PredictionRecord | null;
  status: CaseStatus;
  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CbctFeatures {
  imageQualityScore: number | null; // configurable scale
  boneDensityHu: number | null; // Hounsfield Units (configurable)
  boneQuality: BoneQualityType | null;
  buccolingualWidth: number | null; // mm
  apicocoronalHeight: number | null; // mm
  corticalBoneThickness: number | null; // mm
  sinusFloorToCrest: number | null; // mm (maxilla, nullable)
  distanceToIA: number | null; // mm (mandible, nullable) — Inferior Alveolar canal
  buccalPlateThickness: number | null; // mm
  interradicularBone: number | null; // mm (when adjacent teeth present)
  source: string; // "Manual entry" | "Configurable"
  assessmentStatus: "Entered" | "Pending" | "Partial";
}

export interface ClinicalFeatures {
  smokingStatus: "Non-smoker" | "Former smoker" | "Current smoker" | null;
  diabetesStatus: "None" | "Controlled" | "Uncontrolled" | null;
  bruxism: boolean | null;
  implantSystem: string; // configurable brand — treat as research variable
  implantDiameterMm: number | null;
  implantLengthMm: number | null;
  loadingProtocol: "Immediate" | "Early" | "Conventional" | null;
  prostheticType: "Crown" | "Bridge" | "Overdenture" | null;
  augmentationPerformed: boolean | null;
  // Additional research variables are configurable; placeholder list:
  additionalVariables: { label: string; value: string }[];
}

export interface OutcomeRecord {
  documentedOutcome: OutcomeClass | null;
  followUpMonths: number | null;
  assessmentDate: string | null;
  classificationSource: string; // "Research protocol definition (configurable)"
  notes: string;
}

export interface PredictionRecord {
  modelId: string;
  modelVersion: string;
  algorithm: ModelAlgorithm;
  predictedOutcome: OutcomeClass;
  probability: number; // 0-1
  featureContributions: { feature: string; contribution: number }[];
  shapAvailable: boolean;
  generatedAt: string; // ISO
  status: PredictionStatus;
}

export interface ModelVersion {
  id: string;
  version: string;
  algorithm: ModelAlgorithm;
  status: ModelStatus;
  trainingDatasetVersion: string;
  trainingDatasetId?: string | null;
  featureList: string[];
  hyperparameters?: Record<string, number | string>;
  trainTestSplit?: number; // e.g. 0.2 = 20% test
  cvFolds?: number;
  randomSeed?: number;
  trainedAt: string | null;
  validationStrategy: string;
  metrics: ModelMetrics | null;
  rocAuc: number | null;
  fileLocation: string;
}

// Minimum dataset size required to train a model (configurable in Research Configuration)
export const MIN_TRAINING_RECORDS = 5;

export interface ModelMetrics {
  accuracy: number;
  sensitivity: number;
  specificity: number;
  precision: number;
  f1: number;
  rocAuc: number;
  confusionMatrix: { tp: number; fp: number; fn: number; tn: number };
  rocCurve: { fpr: number; tpr: number }[];
  prCurve: { recall: number; precision: number }[];
  calibration: { predicted: number; actual: number }[];
}

export interface DatasetRecord {
  id: string;
  name: string;
  records: number;
  eligible: number;
  excluded: number;
  missingValues: number;
  duplicates: number;
  invalidValues: number;
  qualityScore: number; // 0-100, calculated from validation
  status: "Validated" | "Needs Review" | "Imported";
  importedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  caseId: string | null;
  status: "Success" | "Warning" | "Error";
  detail: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "Active" | "Suspended";
  lastLogin: string | null;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  type:
    | "Study Dataset Summary"
    | "Model Performance Report"
    | "Prediction Analysis"
    | "Feature Analysis"
    | "Data Quality Report"
    | "Final Research Summary";
  generatedBy: string;
  generatedAt: string;
  format: "PDF" | "Excel" | "CSV";
  records: number;
  status: "Ready" | "Generating";
}

// View identifiers for the state-based router
export type ViewId =
  | "dashboard"
  | "cases"
  | "new-case"
  | "cbct-workspace"
  | "cbct"
  | "clinical"
  | "outcomes"
  | "prediction"
  | "model-performance"
  | "feature-analysis"
  | "dataset"
  | "reports"
  | "audit"
  | "users"
  | "settings";
