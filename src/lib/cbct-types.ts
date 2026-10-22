// CBCT AI processing domain — types, state machine, and structured results.
// CRITICAL: No fake AI. Where no real model is connected, results are clearly
// labeled "DEMO AI ANALYSIS" / "Synthetic demonstration".

export type CbctStage =
  | "IDLE"
  | "UPLOADING"
  | "VALIDATING"
  | "VERIFYING_IMAGE"
  | "ANALYZING_QUALITY"
  | "CHECKING_ORIENTATION"
  | "CHECKING_ANATOMY"
  | "CHECKING_IMPLANT_SITE"
  | "EXTRACTING_FEATURES"
  | "READY_FOR_REVIEW"
  | "PREDICTING"
  | "COMPLETE"
  | "FAILED";

export const STAGE_FLOW: CbctStage[] = [
  "UPLOADING",
  "VALIDATING",
  "VERIFYING_IMAGE",
  "ANALYZING_QUALITY",
  "CHECKING_ORIENTATION",
  "CHECKING_ANATOMY",
  "CHECKING_IMPLANT_SITE",
  "EXTRACTING_FEATURES",
  "READY_FOR_REVIEW",
];

export interface CbctFileInfo {
  name: string;
  size: number; // bytes
  format: "DICOM" | "DICOM ZIP" | "NIfTI" | "Unsupported";
  slices: number;
  width: number;
  height: number;
  depth: number;
  voxelSpacingMm: [number, number, number];
  studyId: string | null; // only if permitted
}

export type CheckStatus = "pass" | "warn" | "fail" | "pending";

export interface ValidationCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}

export interface PrivacyCheck {
  status: CheckStatus;
  label: string;
  detail: string;
}

export type QualityGrade = "GOOD" | "REVIEW" | "INSUFFICIENT";

export interface QualityMetric {
  id: string;
  label: string;
  value: string; // e.g. "Adequate" — only if a real measure exists
  status: CheckStatus;
  detail?: string;
}

export interface QualityAssessment {
  grade: QualityGrade;
  explanation: string;
  metrics: QualityMetric[];
}

export interface CbctVerification {
  checks: ValidationCheck[];
  summary: string;
}

export interface ExtractedFeature {
  id: string;
  feature: string; // must come from the research data dictionary
  value: string | number | null;
  unit: string;
  source: "AI model" | "Manual" | "Researcher";
  confidence: number | null; // only if a real calibrated confidence exists; else null
  status: "AI generated" | "Researcher verified" | "Needs review";
  researcherValue?: string | number | null; // human override
  explanation: string;
}

export interface CbctPipelineState {
  stage: CbctStage;
  error: { code: string; message: string } | null;
  file: CbctFileInfo | null;
  validation: ValidationCheck[];
  privacy: PrivacyCheck | null;
  verification: CbctVerification | null;
  quality: QualityAssessment | null;
  features: ExtractedFeature[];
  researcherApproved: boolean;
  demo: boolean; // true when results are synthetic
  startedAt: string | null;
  completedAt: string | null;
}

export const ERROR_CODES = {
  INVALID_DICOM: {
    code: "INVALID_DICOM",
    message: "Uploaded file is not a valid DICOM volume.",
  },
  INSUFFICIENT_COVERAGE: {
    code: "INSUFFICIENT_COVERAGE",
    message:
      "The uploaded volume does not provide adequate anatomical coverage for the configured research assessment.",
  },
  IMAGE_QUALITY_LOW: {
    code: "IMAGE_QUALITY_LOW",
    message: "Image quality may prevent reliable feature assessment.",
  },
  MODEL_UNAVAILABLE: {
    code: "MODEL_UNAVAILABLE",
    message: "The configured AI model is currently unavailable.",
  },
  FEATURE_EXTRACTION_FAILED: {
    code: "FEATURE_EXTRACTION_FAILED",
    message:
      "Feature extraction could not be completed. Please review the image and try again.",
  },
  DISGUISED_FILE: {
    code: "INVALID_DICOM",
    message:
      "File appears to be a renamed 2D image, not a volumetric CBCT dataset.",
  },
} as const;

// Stage metadata for UI rendering
export const STAGE_META: Record<
  CbctStage,
  { label: string; short: string; desc: string }
> = {
  IDLE: { label: "Awaiting CBCT", short: "Idle", desc: "Upload a dataset to begin" },
  UPLOADING: { label: "Uploading", short: "Upload", desc: "Transferring file" },
  VALIDATING: { label: "Validating", short: "Validate", desc: "DICOM structure & volume" },
  VERIFYING_IMAGE: { label: "Verifying image", short: "Verify", desc: "CBCT scan verification" },
  ANALYZING_QUALITY: { label: "Analyzing quality", short: "Quality", desc: "AI image quality assessment" },
  CHECKING_ORIENTATION: { label: "Checking orientation", short: "Orient", desc: "Anatomical orientation" },
  CHECKING_ANATOMY: { label: "Checking anatomy", short: "Anatomy", desc: "Anatomical coverage" },
  CHECKING_IMPLANT_SITE: { label: "Checking implant site", short: "Site", desc: "Implant-site visibility" },
  EXTRACTING_FEATURES: { label: "Extracting features", short: "Extract", desc: "AI feature extraction" },
  READY_FOR_REVIEW: { label: "Ready for review", short: "Review", desc: "Researcher review required" },
  PREDICTING: { label: "Predicting", short: "Predict", desc: "ML outcome prediction" },
  COMPLETE: { label: "Complete", short: "Done", desc: "Analysis complete" },
  FAILED: { label: "Failed", short: "Failed", desc: "Processing failed" },
};
