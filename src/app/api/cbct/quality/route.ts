import { NextRequest, NextResponse } from "next/server";

// POST /api/cbct/quality
// AI Image Quality Assessment. DEMO synthetic — no real quality model connected.
// A real model would output calibrated measures; here we return deterministic
// synthetic metrics clearly labeled as demo.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.file) {
      return NextResponse.json(
        { ok: false, error: { code: "NO_FILE", message: "File metadata required." } },
        { status: 400 }
      );
    }

    const metrics = [
      { id: "completeness", label: "Image completeness", value: "Complete", status: "pass", detail: "No missing slices." },
      { id: "consistency", label: "Slice consistency", value: "Consistent", status: "pass", detail: "Uniform slice spacing." },
      { id: "resolution", label: "Resolution", value: "200 µm isotropic", status: "pass", detail: "Adequate for research assessment." },
      { id: "noise", label: "Noise", value: "Low", status: "pass", detail: "Within acceptable range." },
      { id: "artifact", label: "Artifact level", value: "Localized", status: "warn", detail: "Beam-hardening at posterior region." },
      { id: "motion", label: "Motion degradation", value: "None detected", status: "pass", detail: "No patient-motion artifact." },
      { id: "site_vis", label: "Implant-site visibility", value: "Good", status: "pass", detail: "Crest and cortical plate visible." },
      { id: "coverage", label: "Anatomical coverage", value: "Adequate", status: "pass", detail: "Full alveolar arch captured." },
    ];

    const grade = "REVIEW";
    const explanation =
      "Image quality is sufficient for feature assessment, with a localized artifact that warrants researcher review before extraction.";

    return NextResponse.json({
      ok: true,
      grade,
      explanation,
      metrics,
      demo: true,
      demoLabel: "DEMO AI ANALYSIS — Synthetic demonstration",
      nextStage: "CHECKING_ORIENTATION",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: "QUALITY_FAILED", message: "Quality assessment failed." } },
      { status: 500 }
    );
  }
}
