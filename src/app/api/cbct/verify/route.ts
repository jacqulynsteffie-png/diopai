import { NextRequest, NextResponse } from "next/server";

// POST /api/cbct/verify
// AI CBCT verification: verifies whether the dataset is suitable for the
// research workflow. DEMO results — clearly labeled. No real model connected.
// A real model would produce these checks; here they are deterministic
// synthetic demonstration values.
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

    // Deterministic verification checks (DEMO synthetic)
    const checks = [
      { id: "readable", label: "CBCT volume detected", status: "pass", detail: "Readable volumetric dataset." },
      { id: "volumetric", label: "Volumetric acquisition", status: "pass", detail: "Isotropic voxel spacing confirmed." },
      { id: "coverage", label: "Anatomical coverage adequate", status: "pass", detail: "Implant-site region fully captured." },
      { id: "quality", label: "Image quality acceptable", status: "warn", detail: "Minor beam-hardening artifact at posterior region." },
      { id: "site", label: "Implant site visible", status: "pass", detail: "Alveolar crest clearly delineated." },
      { id: "artifacts", label: "Artifact assessment", status: "warn", detail: "Localized artifact — researcher review recommended." },
      { id: "features", label: "Configured features assessable", status: "pass", detail: "Bone density, quality, and dimensions assessable." },
    ];

    const summary =
      "Dataset suitable for the configured research workflow. Two items require researcher attention before feature extraction.";

    return NextResponse.json({
      ok: true,
      checks,
      summary,
      demo: true,
      demoLabel: "DEMO AI ANALYSIS — Synthetic demonstration",
      nextStage: "READY_FOR_REVIEW",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: "VERIFY_FAILED", message: "Verification failed." } },
      { status: 500 }
    );
  }
}
