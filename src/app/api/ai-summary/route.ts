import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// Generates a research-use narrative summary of a research case's prediction.
// Uses the LLM skill (z-ai-web-dev-sdk) on the backend only.
// CRITICAL: the LLM is constrained to NEVER produce clinical diagnosis,
// treatment recommendations, or invented thresholds. It only summarizes
// the research data provided and restates the existing research-use disclaimer.

const SYSTEM_PROMPT = `You are a research assistant for the ImplantAI Research platform — a retrospective research study titled "Evaluation of an Artificial Intelligence-Based Predictive Model for Dental Implant Outcomes Based on Preoperative CBCT-Derived Features".

Your role is strictly limited:
- Summarize the provided de-identified research case data and its AI prediction in plain language for researchers.
- State the predicted outcome and probability as given. Do NOT recompute or reinterpret.
- Describe the top contributing features as provided. Feature contributions indicate model reliance, NOT causation.
- You must NOT provide a clinical diagnosis, treatment recommendation, or any medical decision.
- You must NOT invent clinical thresholds, outcome definitions, or CBCT measurements not present in the input.
- Always end by restating the research-use disclaimer verbatim.
- Keep the summary under 180 words, neutral and scientific in tone.`;

const DISCLAIMER =
  "This prediction is intended for research evaluation and does not replace professional clinical assessment or treatment planning.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      caseId,
      age,
      sex,
      implantSite,
      prediction,
      contributions,
      documentedOutcome,
    } = body ?? {};

    if (!caseId) {
      return NextResponse.json({ error: "caseId is required" }, { status: 400 });
    }

    const userContent = `De-identified research case summary request. Provide a concise, neutral research-use narrative.

Research Case: ${caseId}
Age: ${age ?? "—"} | Sex: ${sex ?? "—"} | Implant Site: ${implantSite ?? "—"}
AI Prediction: ${prediction?.predictedOutcome ?? "—"} (probability ${prediction ? Math.round(prediction.probability * 100) : "—"}%)
Top contributing features (research-use, NOT causation): ${
      (contributions ?? [])
        .slice(0, 5)
        .map((c: { feature: string; contribution: number }) => `${c.feature} (${c.contribution >= 0 ? "+" : ""}${c.contribution.toFixed(3)})`)
        .join(", ") || "—"
    }
Documented outcome (if available): ${documentedOutcome ?? "Pending"}

Remember: feature contributions indicate model reliance, not causation. End by restating the research-use disclaimer verbatim.`;

    let summary: string;
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        thinking: { type: "disabled" },
      });
      summary =
        completion.choices[0]?.message?.content?.trim() ||
        `Research case ${caseId}: AI prediction ${prediction?.predictedOutcome ?? "—"} (${prediction ? Math.round(prediction.probability * 100) : "—"}%). ${DISCLAIMER}`;
    } catch {
      // Deterministic fallback if the LLM is unavailable
      summary = `Research case ${caseId}: AI prediction ${
        prediction?.predictedOutcome ?? "—"
      } (probability ${prediction ? Math.round(prediction.probability * 100) : "—"}%). Top contributing features: ${(contributions ?? [])
        .slice(0, 3)
        .map((c: { feature: string; contribution: number }) => c.feature)
        .join(", ")}. Feature contributions indicate model reliance, not causation. ${DISCLAIMER}`;
    }

    return NextResponse.json({
      caseId,
      summary,
      disclaimer: DISCLAIMER,
      generatedAt: new Date().toISOString(),
      model: "LLM research-assistant (constrained)",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to generate research summary", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
