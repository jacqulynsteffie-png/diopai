import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/models — list all model versions from the DB
export async function GET() {
  try {
    const rows = await db.modelVersion.findMany({ orderBy: { createdAt: "desc" } });
    const models = rows.map((r) => ({
      id: r.modelId,
      modelId: r.modelId,
      version: r.version,
      algorithm: r.algorithm,
      status: r.status,
      trainingDatasetVersion: r.trainingDatasetVersion,
      featureList: r.featureList ? JSON.parse(r.featureList) : [],
      hyperparameters: r.metrics ? safeParse(r.metrics) : undefined, // note: stored in metrics JSON for demo simplicity
      trainedAt: r.trainedAt?.toISOString() ?? null,
      validationStrategy: r.validationStrategy,
      rocAuc: r.rocAuc ?? null,
      metrics: r.metrics ? safeParse(r.metrics) : null,
      fileLocation: r.fileLocation,
    }));
    return NextResponse.json({ ok: true, models, demo: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable." } },
      { status: 503 }
    );
  }
}

function safeParse(s: string | null) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// POST /api/models — durably store a trained/registered model version
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      modelId,
      version,
      algorithm,
      status = "Development",
      trainingDatasetVersion,
      featureList = [],
      hyperparameters,
      trainTestSplit,
      cvFolds,
      randomSeed,
      validationStrategy,
      rocAuc,
      metrics,
      fileLocation,
    } = body ?? {};

    if (!modelId || !version || !algorithm) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_MODEL", message: "modelId, version, algorithm are required." } },
        { status: 400 }
      );
    }

    const created = await db.modelVersion.create({
      data: {
        modelId,
        version,
        algorithm,
        status,
        trainingDatasetVersion: trainingDatasetVersion ?? "—",
        featureList: JSON.stringify(featureList),
        validationStrategy: validationStrategy ?? "5-fold stratified cross-validation",
        rocAuc: rocAuc ?? null,
        metrics: metrics ? JSON.stringify({ ...metrics, hyperparameters, trainTestSplit, cvFolds, randomSeed }) : null,
        trainedAt: body.trainedAt ? new Date(body.trainedAt) : new Date(),
        fileLocation: fileLocation ?? `/models/${modelId}.joblib`,
      },
    });

    return NextResponse.json({ ok: true, id: created.id, modelId: created.modelId, stored: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: "STORE_FAILED", message: "Could not store model." } },
      { status: 500 }
    );
  }
}
