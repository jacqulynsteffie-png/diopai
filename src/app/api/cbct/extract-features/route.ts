import { NextRequest, NextResponse } from "next/server";

// POST /api/cbct/extract-features
// AI Feature Extraction. Runs the configured research feature set (from the
// data dictionary) and returns extracted values. DEMO synthetic values —
// clearly labeled. Confidence is shown only as a placeholder calibrated
// measure; if no real calibrated confidence exists it would be null.
// DO NOT invent medical variables — features come from the research dictionary.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file } = body ?? {};
    if (!file) {
      return NextResponse.json(
        { ok: false, error: { code: "NO_FILE", message: "File metadata required." } },
        { status: 400 }
      );
    }

    // Features MUST come from the research data dictionary. These match
    // the CBCT-derived feature set defined in DATA_DICTIONARY.md / types.ts.
    const features = [
      {
        id: "bone_density_hu",
        feature: "Bone Density (HU)",
        value: 742,
        unit: "Hounsfield Units",
        source: "AI model",
        confidence: 0.91,
        status: "AI generated",
        explanation: "Source: CBCT-derived research feature. Assessment method: AI model. Researcher verification: Pending.",
      },
      {
        id: "bone_quality",
        feature: "Bone Quality",
        value: "Type II",
        unit: "Lekholm & Zarb",
        source: "AI model",
        confidence: 0.84,
        status: "AI generated",
        explanation: "Source: CBCT-derived research feature. Assessment method: AI model. Researcher verification: Pending.",
      },
      {
        id: "buccolingual_width",
        feature: "Buccolingual Width",
        value: 6.4,
        unit: "mm",
        source: "AI model",
        confidence: 0.88,
        status: "AI generated",
        explanation: "Source: CBCT-derived research feature. Assessment method: AI model. Researcher verification: Pending.",
      },
      {
        id: "apicocoronal_height",
        feature: "Apicocoronal Height",
        value: 11.2,
        unit: "mm",
        source: "AI model",
        confidence: 0.86,
        status: "AI generated",
        explanation: "Source: CBCT-derived research feature. Assessment method: AI model. Researcher verification: Pending.",
      },
      {
        id: "cortical_thickness",
        feature: "Cortical Bone Thickness",
        value: 1.6,
        unit: "mm",
        source: "AI model",
        confidence: 0.79,
        status: "Needs review",
        explanation: "Source: CBCT-derived research feature. Assessment method: AI model. Lower confidence due to localized artifact. Researcher verification: Required.",
      },
      {
        id: "buccal_plate",
        feature: "Buccal Plate Thickness",
        value: 1.1,
        unit: "mm",
        source: "AI model",
        confidence: 0.82,
        status: "AI generated",
        explanation: "Source: CBCT-derived research feature. Assessment method: AI model. Researcher verification: Pending.",
      },
    ];

    return NextResponse.json({
      ok: true,
      features,
      demo: true,
      demoLabel: "DEMO AI ANALYSIS — Synthetic demonstration",
      nextStage: "READY_FOR_REVIEW",
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "FEATURE_EXTRACTION_FAILED", message: "Feature extraction could not be completed." },
      },
      { status: 500 }
    );
  }
}
