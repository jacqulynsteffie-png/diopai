// Seed the SQLite database with synthetic demo research data.
// Run with: bun run db:seed
// IMPORTANT: All data is SYNTHETIC. DEMO MODE only.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }
function ri(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rf(a: number, b: number, dp = 1) { return parseFloat((Math.random() * (b - a) + a).toFixed(dp)); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

const SITES = ["Maxilla Anterior", "Maxilla Premolar", "Maxilla Molar", "Mandible Anterior", "Mandible Premolar", "Mandible Molar"];
const SEXES = ["Male", "Female"];
const QUALITIES = ["Excellent", "Adequate", "Suboptimal"];
const BONE_TYPES = ["Type I", "Type II", "Type III", "Type IV"];
const SMOKING = ["Non-smoker", "Former smoker", "Current smoker"];
const DIABETES = ["None", "Controlled", "Uncontrolled"];
const LOADING = ["Immediate", "Early", "Conventional"];
const PROSTHETIC = ["Crown", "Bridge", "Overdenture"];

async function main() {
  // wipe
  await db.auditLog.deleteMany();
  await db.prediction.deleteMany();
  await db.outcome.deleteMany();
  await db.clinicalFeature.deleteMany();
  await db.cbctFeature.deleteMany();
  await db.researchCase.deleteMany();
  await db.user.deleteMany();
  await db.modelVersion.deleteMany();
  await db.datasetRecord.deleteMany();

  // users
  const admin = await db.user.create({ data: { name: "Dr. A. Researcher", email: "a.researcher@diop-ai.research", role: "Admin", status: "Active", lastLogin: daysAgo(0) } });
  const researcher = await db.user.create({ data: { name: "Dr. B. Analyst", email: "b.analyst@diop-ai.research", role: "Researcher", status: "Active", lastLogin: daysAgo(1) } });

  // model versions
  await db.modelVersion.create({
    data: {
      modelId: "model_xgb_v1", version: "1.0", algorithm: "XGBoost", status: "Validated",
      trainingDatasetVersion: "dataset_v1 (128 records, synthetic)",
      featureList: JSON.stringify(["Bone Density (HU)", "Bone Quality", "Cortical Bone Thickness", "Smoking Status", "Diabetes Status"]),
      trainedAt: daysAgo(14), validationStrategy: "5-fold stratified cross-validation", rocAuc: 0.82,
      metrics: JSON.stringify({ accuracy: 0.81, sensitivity: 0.78, specificity: 0.83, precision: 0.76, f1: 0.77, rocAuc: 0.82 }),
      fileLocation: "/models/model_xgb_v1.joblib (demo path)",
    }
  });

  // datasets
  await db.datasetRecord.create({ data: { name: "retrospective_implant_v1.csv", records: 128, eligible: 112, excluded: 16, missingValues: 9, duplicates: 2, invalidValues: 3, qualityScore: 88, status: "Validated", importedAt: daysAgo(14) } });

  // research cases
  const N = 64;
  for (let i = 0; i < N; i++) {
    const age = ri(18, 80);
    const site = pick(SITES);
    const isMaxilla = site.startsWith("Maxilla");
    const cbctAvailable = Math.random() > 0.08;
    const quality = cbctAvailable ? pick(QUALITIES) : "Suboptimal";
    const boneDensity = ri(300, 1100);
    const boneType = pick(BONE_TYPES);
    const bl = rf(3.5, 8.5);
    const ac = rf(6, 14);
    const cortical = rf(0.6, 2.6);
    const smoking = pick(SMOKING);
    const diabetes = pick(DIABETES);
    const bruxism = Math.random() > 0.7;
    const implLength = rf(8, 13);
    const implDia = rf(3.3, 5.0);
    const loading = pick(LOADING);
    const prosthetic = pick(PROSTHETIC);
    const augmentation = Math.random() > 0.6;
    const hasOutcome = Math.random() > 0.3;
    const documented = hasOutcome ? (Math.random() > 0.26 ? "Success" : "Failure") : null;
    const followUp = hasOutcome ? ri(3, 36) : null;
    const createdDays = ri(1, 220);
    const caseId = `RC-${String(2000 + i).padStart(4, "0")}`;

    const c = await db.researchCase.create({
      data: {
        caseId, age, sex: pick(SEXES), implantSite: site, toothPosition: `#${ri(11, 47)}`,
        cbctAvailable, cbctQuality: quality, eligibility: "Eligible", status: "Active",
        createdBy: pick([admin.name, researcher.name]), createdById: pick([admin.id, researcher.id]),
        createdAt: daysAgo(createdDays), updatedAt: daysAgo(ri(0, createdDays)),
      }
    });

    await db.cbctFeature.create({
      data: {
        caseIdRef: c.id, imageQualityScore: ri(2, 5), boneDensityHu: boneDensity, boneQuality: boneType,
        buccolingualWidth: bl, apicocoronalHeight: ac, corticalBoneThickness: cortical,
        sinusFloorToCrest: isMaxilla ? rf(1, 12) : null, distanceToIA: !isMaxilla ? rf(2, 14) : null,
        buccalPlateThickness: rf(0.4, 2.0), interradicularBone: Math.random() > 0.4 ? rf(1.5, 4.0) : null,
        source: "Manual entry", assessmentStatus: Math.random() > 0.2 ? "Entered" : "Partial",
      }
    });

    await db.clinicalFeature.create({
      data: {
        caseIdRef: c.id, smokingStatus: smoking, diabetesStatus: diabetes, bruxism,
        implantSystem: pick(["System A", "System B", "System C"]), implantDiameterMm: implDia, implantLengthMm: implLength,
        loadingProtocol: loading, prostheticType: prosthetic, augmentationPerformed: augmentation,
      }
    });

    if (hasOutcome) {
      await db.outcome.create({
        data: {
          caseIdRef: c.id, documentedOutcome: documented, followUpMonths: followUp,
          assessmentDate: daysAgo(ri(5, 120)),
          classificationSource: "Research protocol definition (configurable)", notes: "",
        }
      });
    }

    // prediction (deterministic-ish)
    let score = 0.5;
    score += ((boneDensity - 500) / 1000) * 0.18;
    const map: Record<string, number> = { "Type I": 0.12, "Type II": 0.1, "Type III": -0.04, "Type IV": -0.14 };
    score += map[boneType] ?? 0;
    score += ((cortical - 1.2) / 2) * 0.12;
    score += smoking === "Current smoker" ? -0.1 : 0.04;
    score += diabetes === "Uncontrolled" ? -0.12 : 0.02;
    const prob = Math.max(0.05, Math.min(0.97, score));
    await db.prediction.create({
      data: {
        caseIdRef: c.id, modelId: "model_xgb_v1", modelVersion: "1.0", algorithm: "XGBoost",
        predictedOutcome: prob >= 0.5 ? "Success" : "Failure", probability: parseFloat(prob.toFixed(3)),
        shapAvailable: true, status: "Completed",
      }
    });
  }

  // audit logs
  const actions = [
    { action: "Created research case", module: "Research Cases" },
    { action: "Updated CBCT feature", module: "CBCT Features" },
    { action: "Imported dataset", module: "Dataset" },
    { action: "Generated prediction", module: "Predictions" },
    { action: "Generated report", module: "Reports" },
  ];
  for (let i = 0; i < 30; i++) {
    const a = pick(actions);
    await db.auditLog.create({
      data: {
        user: pick([admin.name, researcher.name, "System"]),
        action: a.action, module: a.module,
        caseId: Math.random() > 0.4 ? `RC-${String(2000 + ri(0, 63)).padStart(4, "0")}` : null,
        status: Math.random() > 0.12 ? "Success" : Math.random() > 0.5 ? "Warning" : "Error",
        detail: a.action + " — synthetic audit entry.", timestamp: daysAgo(ri(0, 30)),
      }
    });
  }

  console.log(`Seeded ${N} synthetic research cases, 2 users, 1 model, 1 dataset, 30 audit logs.`);
  console.log("DEMO MODE — Synthetic research data only.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
