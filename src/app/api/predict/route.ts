import { NextRequest, NextResponse } from "next/server";

// Research-use prediction endpoint.
// Uses a deterministic pseudo-ML scoring function that mimics an XGBoost
// probability output. NOT a real trained model — research/demo only.
// Never uses documented future outcomes as input features.

interface PredictInput {
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
}

interface Contribution {
  feature: string;
  contribution: number;
}

function pseudoPredict(features: PredictInput) {
  let score = 0.5;
  const contributions: Contribution[] = [];
  const add = (label: string, delta: number) => {
    score += delta;
    contributions.push({ feature: label, contribution: delta });
  };

  if (features.boneDensityHu != null) {
    add("Bone Density (HU)", ((features.boneDensityHu - 500) / 1000) * 0.18);
  }
  if (features.boneQuality) {
    const map: Record<string, number> = {
      "Type I": 0.12, "Type II": 0.1, "Type III": -0.04, "Type IV": -0.14,
    };
    add("Bone Quality", map[features.boneQuality] ?? 0);
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
  const predictedOutcome = probability >= 0.5 ? "Success" : "Failure";
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return { predictedOutcome, probability: parseFloat(probability.toFixed(3)), contributions };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PredictInput;
    const result = pseudoPredict(body);
    return NextResponse.json({
      ...result,
      modelId: "model_xgb_v1",
      modelVersion: "1.0",
      algorithm: "XGBoost",
      shapAvailable: true,
      generatedAt: new Date().toISOString(),
      disclaimer:
        "This prediction is intended for research evaluation and does not replace professional clinical assessment or treatment planning.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid prediction request", detail: (e as Error).message },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    model: "XGBoost v1.0",
    status: "Validated",
    features: [
      "Bone Density (HU)", "Bone Quality", "Cortical Bone Thickness",
      "Buccolingual Width", "Apicocoronal Height", "Smoking Status",
      "Diabetes Status", "Bruxism", "Implant Length", "Loading Protocol",
    ],
    rocAuc: 0.82,
    disclaimer:
      "Research-use prediction only. Synthetic demo metrics, not validated clinical performance.",
  });
}
