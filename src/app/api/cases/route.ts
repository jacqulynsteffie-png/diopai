import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/cases — list research cases
export async function GET() {
  try {
    const cases = await db.researchCase.findMany({
      orderBy: { createdAt: "desc" },
      include: { cbct: true, clinical: true, outcome: true, prediction: true },
    });
    return NextResponse.json({ cases, total: cases.length, demo: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Database unavailable", detail: (e as Error).message },
      { status: 503 }
    );
  }
}

// POST /api/cases — create a de-identified research case
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      caseId,
      age,
      sex,
      implantSite,
      toothPosition,
      cbctAvailable,
      cbctQuality,
      eligibility,
    } = body ?? {};

    if (!caseId || age == null || !sex || !implantSite) {
      return NextResponse.json(
        { error: "Missing required fields: caseId, age, sex, implantSite" },
        { status: 400 }
      );
    }

    const created = await db.researchCase.create({
      data: {
        caseId,
        age: Number(age),
        sex,
        implantSite,
        toothPosition: toothPosition ?? null,
        cbctAvailable: cbctAvailable ?? true,
        cbctQuality: cbctQuality ?? "Adequate",
        eligibility: eligibility ?? "Requires Review",
        createdBy: body.createdBy ?? "researcher",
        status: body.status ?? "Active",
      },
    });

    // audit log
    await db.auditLog.create({
      data: {
        user: body.createdBy ?? "researcher",
        action: "Created research case",
        module: "Research Cases",
        caseId: created.caseId,
        status: "Success",
        detail: `Created ${created.caseId}`,
      },
    });

    return NextResponse.json({ case: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create research case", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
