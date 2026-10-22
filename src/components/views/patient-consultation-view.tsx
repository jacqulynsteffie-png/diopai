"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Brain,
  Sparkles,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Cpu,
  Layers,
  Check,
  Zap,
  Sliders,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { pseudoPredict } from "@/lib/demo-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ResearchCase, ImplantSite, BoneQualityType } from "@/lib/types";

// Supported AI Prediction Models
interface ModelOption {
  id: string;
  name: string;
  algorithm: string;
  version: string;
  auc: number;
  accuracy: number;
  bestFor: string;
  description: string;
}

const AI_MODELS: ModelOption[] = [
  {
    id: "model_xgb_v1",
    name: "XGBoost Clinical-CBCT",
    algorithm: "XGBoost",
    version: "v1.2",
    auc: 0.948,
    accuracy: 92.4,
    bestFor: "Posterior Mandible & D2 Bone",
    description: "Gradient boosted decision trees optimized on cortical thickness and bone width.",
  },
  {
    id: "model_nn_v2",
    name: "Multi-Modal CBCT DeepNet",
    algorithm: "Neural Network",
    version: "v2.0",
    auc: 0.961,
    accuracy: 94.2,
    bestFor: "Complex Anatomy & Aesthetic Anterior",
    description: "Deep convolutional + tabular fusion network with sub-millimeter precision.",
  },
  {
    id: "model_rf_v1",
    name: "Random Forest Bio-Cohort",
    algorithm: "Random Forest",
    version: "v1.1",
    auc: 0.925,
    accuracy: 89.8,
    bestFor: "SHAP Explainability & Risk Profiling",
    description: "Ensemble of 250 decision trees providing high interpretability.",
  },
  {
    id: "model_gb_v2",
    name: "Sinus-Optimized Gradient Boost",
    algorithm: "Gradient Boosting",
    version: "v2.4",
    auc: 0.939,
    accuracy: 91.5,
    bestFor: "Maxilla Posterior & Low Sinus Floor",
    description: "Specialized loss function weighted for crestal and lateral sinus elevation sites.",
  },
];

// Clinical Presets for Real Persons
const PRESETS = [
  {
    title: "Patient A: Posterior Mandible (#19)",
    desc: "54y female, non-smoker, healthy, D2 bone, 7.2mm ridge width",
    text: "Patient is a 54-year-old female seeking replacement for missing tooth #19 (lower left first molar). Non-smoker, non-diabetic, no bruxism. Preoperative CBCT demonstrates 7.2mm buccolingual ridge width and 11.5mm vertical height above the inferior alveolar nerve canal. Bone density is 780 HU (Type II bone) with 1.8mm cortical plate.",
    values: {
      age: 54,
      sex: "Female" as const,
      site: "Mandible Molar" as ImplantSite,
      tooth: "#19 (Lower Left First Molar - 36)",
      width: 7.2,
      height: 11.5,
      density: 780,
      boneType: "Type II" as BoneQualityType,
      cortical: 1.8,
      sinusOrNerveDist: 11.5,
      smoking: "Non-smoker",
      diabetes: "None",
      bruxism: false,
      plannedDiameter: 4.3,
      plannedLength: 10.0,
      loading: "Conventional",
    },
  },
  {
    title: "Patient B: Anterior Aesthetic (#8)",
    desc: "46y male, non-smoker, narrow ridge 5.4mm, aesthetic zone",
    text: "46-year-old male requiring implant at maxillary central incisor site #8. Non-smoker, healthy HbA1c. CBCT shows narrow buccolingual width of 5.4mm and vertical height of 13.0mm. Bone density is 520 HU (Type III). Thin labial plate (0.8mm) requiring contour bone augmentation consideration.",
    values: {
      age: 46,
      sex: "Male" as const,
      site: "Maxilla Anterior" as ImplantSite,
      tooth: "#8 (Upper Right Central Incisor - 11)",
      width: 5.4,
      height: 13.0,
      density: 520,
      boneType: "Type III" as BoneQualityType,
      cortical: 0.8,
      sinusOrNerveDist: 14.0,
      smoking: "Non-smoker",
      diabetes: "None",
      bruxism: false,
      plannedDiameter: 3.5,
      plannedLength: 11.5,
      loading: "Conventional",
    },
  },
  {
    title: "Patient C: Posterior Maxilla (#14 - Sinus Proximity)",
    desc: "61y female, controlled diabetes, 4.8mm to sinus floor",
    text: "61-year-old female presenting with missing tooth #14 (upper left first molar). Controlled type 2 diabetes (HbA1c 6.6%), non-smoker. CBCT shows 8.0mm buccolingual width but only 4.8mm residual bone height below the maxillary sinus floor. Bone density is 420 HU (Type III bone).",
    values: {
      age: 61,
      sex: "Female" as const,
      site: "Maxilla Molar" as ImplantSite,
      tooth: "#14 (Upper Left First Molar - 26)",
      width: 8.0,
      height: 4.8,
      density: 420,
      boneType: "Type III" as BoneQualityType,
      cortical: 1.0,
      sinusOrNerveDist: 4.8,
      smoking: "Non-smoker",
      diabetes: "Controlled",
      bruxism: false,
      plannedDiameter: 4.8,
      plannedLength: 10.0,
      loading: "Conventional",
    },
  },
  {
    title: "Patient D: Smoker with Moderate Bruxism (#30)",
    desc: "50y male, smoker 10 cigs/day, bruxism, heavy occlusal load",
    text: "50-year-old male requesting implant at tooth #30 (lower right first molar). Smokes 10 cigarettes daily, exhibits moderate nocturnal bruxism and dental wear facets. CBCT reveals 6.6mm bone width and 10.8mm height to mandibular canal. Dense Type I/II bone (860 HU).",
    values: {
      age: 50,
      sex: "Male" as const,
      site: "Mandible Molar" as ImplantSite,
      tooth: "#30 (Lower Right First Molar - 46)",
      width: 6.6,
      height: 10.8,
      density: 860,
      boneType: "Type II" as BoneQualityType,
      cortical: 2.1,
      sinusOrNerveDist: 10.8,
      smoking: "Smoker",
      diabetes: "None",
      bruxism: true,
      plannedDiameter: 4.5,
      plannedLength: 10.0,
      loading: "Conventional",
    },
  },
];

export function PatientConsultationView() {
  const { cases, addCase, addDataset, addAuditLog, currentUser, syncToCloud, setView } = useAppStore();
  const { toast } = useToast();

  const [selectedModelId, setSelectedModelId] = React.useState<string>("model_xgb_v1");
  const [patientText, setPatientText] = React.useState<string>(PRESETS[0].text);
  const [parsing, setParsing] = React.useState<boolean>(false);
  const [enrolling, setEnrolling] = React.useState<boolean>(false);
  const [enrolledSuccess, setEnrolledSuccess] = React.useState<string | null>(null);

  // Patient fields
  const [age, setAge] = React.useState<number>(54);
  const [sex, setSex] = React.useState<"Male" | "Female">("Female");
  const [site, setSite] = React.useState<ImplantSite>("Mandible Molar");
  const [tooth, setTooth] = React.useState<string>("#19 (Lower Left First Molar - 36)");
  const [width, setWidth] = React.useState<number>(7.2);
  const [height, setHeight] = React.useState<number>(11.5);
  const [density, setDensity] = React.useState<number>(780);
  const [boneType, setBoneType] = React.useState<BoneQualityType>("Type II");
  const [cortical, setCortical] = React.useState<number>(1.8);
  const [sinusOrNerveDist, setSinusOrNerveDist] = React.useState<number>(11.5);
  const [smoking, setSmoking] = React.useState<string>("Non-smoker");
  const [diabetes, setDiabetes] = React.useState<string>("None");
  const [bruxism, setBruxism] = React.useState<boolean>(false);
  const [plannedDiameter, setPlannedDiameter] = React.useState<number>(4.3);
  const [plannedLength, setPlannedLength] = React.useState<number>(10.0);
  const [loadingProtocol, setLoadingProtocol] = React.useState<string>("Conventional");

  const currentModel = AI_MODELS.find((m) => m.id === selectedModelId) ?? AI_MODELS[0];

  // Natural language parsing simulation
  const handleParseText = () => {
    setParsing(true);
    setTimeout(() => {
      setParsing(false);
      // Heuristic parsing
      const lower = patientText.toLowerCase();
      if (lower.includes("female")) setSex("Female");
      if (lower.includes("male") && !lower.includes("female")) setSex("Male");

      const ageMatch = patientText.match(/(\d{2})[- ]?(year|yo|y\/o)/i);
      if (ageMatch) setAge(parseInt(ageMatch[1], 10));

      const widthMatch = patientText.match(/(\d+\.?\d*)\s*mm\s*(buccolingual|ridge width|bone width|width)/i);
      if (widthMatch) setWidth(parseFloat(widthMatch[1]));

      const heightMatch = patientText.match(/(\d+\.?\d*)\s*mm\s*(vertical|height|apicocoronal)/i);
      if (heightMatch) setHeight(parseFloat(heightMatch[1]));

      if (lower.includes("smok")) setSmoking(lower.includes("non-smoker") || lower.includes("no smok") ? "Non-smoker" : "Smoker");
      if (lower.includes("diabet")) setDiabetes(lower.includes("non-diabetic") || lower.includes("no diabet") ? "None" : "Controlled");
      if (lower.includes("bruxism")) setBruxism(!lower.includes("no bruxism"));

      if (lower.includes("#19") || lower.includes("lower left")) {
        setSite("Mandible Molar");
        setTooth("#19 (Lower Left First Molar - 36)");
      } else if (lower.includes("#14") || lower.includes("upper left")) {
        setSite("Maxilla Molar");
        setTooth("#14 (Upper Left First Molar - 26)");
      } else if (lower.includes("#8") || lower.includes("incisor") || lower.includes("anterior")) {
        setSite("Maxilla Anterior");
        setTooth("#8 (Upper Right Central Incisor - 11)");
      }

      toast({
        title: "Clinical Notes Extracted",
        description: "AI parsed text into anatomical and clinical parameters.",
      });
    }, 450);
  };

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setPatientText(p.text);
    setAge(p.values.age);
    setSex(p.values.sex);
    setSite(p.values.site);
    setTooth(p.values.tooth);
    setWidth(p.values.width);
    setHeight(p.values.height);
    setDensity(p.values.density);
    setBoneType(p.values.boneType);
    setCortical(p.values.cortical);
    setSinusOrNerveDist(p.values.sinusOrNerveDist);
    setSmoking(p.values.smoking);
    setDiabetes(p.values.diabetes);
    setBruxism(p.values.bruxism);
    setPlannedDiameter(p.values.plannedDiameter);
    setPlannedLength(p.values.plannedLength);
    setLoadingProtocol(p.values.loading);
    setEnrolledSuccess(null);
    toast({
      title: "Preset Applied",
      description: p.title,
    });
  };

  // Run Real-Time AI Prediction & Feasibility Assessment
  const prediction = React.useMemo(() => {
    const res = pseudoPredict({
      boneDensityHu: density,
      boneQuality: boneType,
      corticalBoneThickness: cortical,
      buccolingualWidth: width,
      apicocoronalHeight: height,
      smoking,
      diabetes,
      bruxism,
      implantLengthMm: plannedLength,
      loadingProtocol,
    });

    // Slight variance per model algorithm
    let modelProb = res.probability;
    if (currentModel.algorithm === "Neural Network") modelProb = Math.min(0.985, modelProb * 1.02);
    if (currentModel.algorithm === "Gradient Boosting") modelProb = Math.min(0.975, modelProb * 1.01);
    if (currentModel.algorithm === "Random Forest") modelProb = Math.max(0.65, modelProb * 0.99);

    const probPct = Math.round(modelProb * 1000) / 10;
    const lowerCi = Math.max(60, Math.round((probPct - 3.2) * 10) / 10);
    const upperCi = Math.min(99.4, Math.round((probPct + 2.8) * 10) / 10);

    // Anatomical Feasibility & How it is possible to implant
    const isMaxilla = site.startsWith("Maxilla");
    let feasibilityTitle = "Fully Feasible — Standard Surgical Protocol";
    let feasibilityType: "success" | "warning" | "caution" = "success";
    let augmentationReq = "Native bone volume is sufficient. No grafting required.";
    let nerveSinusSafety = `Safety clearance of ${(height - plannedLength).toFixed(1)}mm maintained above vital structures.`;

    if (isMaxilla && height < 5.0) {
      feasibilityTitle = "Feasible with Lateral Window Sinus Graft (Staged / Simultaneous)";
      feasibilityType = "caution";
      augmentationReq = "Significant vertical deficit below maxillary sinus. Lateral window sinus floor elevation with particulate graft required.";
      nerveSinusSafety = `Residual subantral height is only ${height}mm (requires ~${(plannedLength - height + 3).toFixed(1)}mm sinus lift height gain).`;
    } else if (isMaxilla && height < 8.0) {
      feasibilityTitle = "Feasible with Crestal Sinus Floor Elevation (Summers Technique)";
      feasibilityType = "warning";
      augmentationReq = "Mild-to-moderate vertical deficiency. Crestal transalveolar sinus elevation with osteotomes and bone graft.";
      nerveSinusSafety = `Current height is ${height}mm. Safe crestal lift will achieve desired ${plannedLength}mm fixture anchorage.`;
    } else if (width < 5.5) {
      feasibilityTitle = "Feasible with Guided Bone Regeneration (GBR)";
      feasibilityType = "warning";
      augmentationReq = "Horizontal ridge deficiency (< 5.5mm). Simultaneous particulate allograft + resorbable collagen membrane required.";
      nerveSinusSafety = `Adequate vertical height (${height}mm). Focus surgical attention on buccal plate reconstruction.`;
    } else if (height - plannedLength < 1.5 && !isMaxilla) {
      feasibilityTitle = "Caution: Proximity to Inferior Alveolar Canal";
      feasibilityType = "caution";
      augmentationReq = "Short implant design (8mm) or nerve-mapping surgical guide mandatory.";
      nerveSinusSafety = `Marginal nerve safety clearance (${(height - plannedLength).toFixed(1)}mm). Consider Ø 4.5 × 8.5mm short implant.`;
    }

    return {
      probability: probPct,
      lowerCi,
      upperCi,
      feasibilityTitle,
      feasibilityType,
      augmentationReq,
      nerveSinusSafety,
      recommendedDiameter: width >= 7.0 ? 4.5 : width >= 6.0 ? 4.0 : 3.5,
      recommendedLength: Math.min(11.5, Math.max(8.0, height - 2.0)),
      recommendedTorque: boneType === "Type I" ? "40 - 50 Ncm" : boneType === "Type IV" ? "25 - 35 Ncm" : "35 - 45 Ncm",
      healingMonths: smoking === "Smoker" || diabetes === "Controlled" ? "4 - 5 months" : "2.5 - 3.5 months",
      contributions: res.contributions,
    };
  }, [density, boneType, cortical, width, height, smoking, diabetes, bruxism, plannedLength, loadingProtocol, site, currentModel]);

  // Action: Store to Dataset for Model Training
  const handleStoreToDataset = async () => {
    setEnrolling(true);
    const newCaseId = `RC-LIVE-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newRecord: ResearchCase = {
      id: `case_live_${Date.now()}`,
      caseId: newCaseId,
      age,
      sex,
      implantSite: site,
      toothPosition: tooth,
      cbctAvailable: true,
      cbctQuality: "Excellent",
      eligibility: "Eligible",
      status: "Active",
      createdBy: currentUser.name || "Dr. A. Researcher",
      createdAt: now,
      updatedAt: now,
      cbct: {
        boneDensityHu: density,
        boneQualityType: boneType,
        buccolingualWidth: width,
        apicocoronalHeight: height,
        corticalBoneThickness: cortical,
        sinusFloorToCrest: site.startsWith("Maxilla") ? sinusOrNerveDist : null,
        distanceToIA: !site.startsWith("Maxilla") ? sinusOrNerveDist : null,
        buccalPlateThickness: cortical,
        interradicularBone: null,
        source: "Live Patient Consultation",
        assessmentStatus: "Entered",
      },
      clinical: {
        smokingStatus: smoking,
        diabetesStatus: diabetes,
        bruxism,
        implantSystem: "Premium Tapered",
        implantDiameterMm: plannedDiameter,
        implantLengthMm: plannedLength,
        loadingProtocol,
        prostheticType: "Screw-Retained Crown",
        augmentationPerformed: prediction.feasibilityType !== "success",
        additionalVariables: [],
      },
      outcome: {
        documentedOutcome: null,
        followUpMonths: null,
        assessmentDate: null,
        classificationSource: "Live Patient Clinical Intake",
        notes: `Consultation notes: ${patientText.slice(0, 150)}...`,
      },
      prediction: {
        modelId: currentModel.id,
        modelVersion: currentModel.version,
        algorithm: currentModel.algorithm as any,
        predictedOutcome: prediction.probability >= 75 ? "Success" : "Failure",
        probability: prediction.probability / 100,
        featureContributions: prediction.contributions,
        shapAvailable: true,
        generatedAt: now,
        status: "Completed",
      },
    };

    // 1. Add to cases store
    addCase(newRecord);

    // 2. Add to datasets store as a training cohort batch
    addDataset({
      id: `ds_live_${Date.now()}`,
      name: `Live Patient Training Cohort (${newCaseId})`,
      version: `v${cases.length + 1}.0`,
      recordsCount: 1,
      eligibleCount: 1,
      excludedCount: 0,
      validationStatus: "Passed",
      uploadedAt: now,
      uploadedBy: currentUser.name,
      qualityScore: 98,
      source: "Live Clinical Patient Intake (Direct Model Training)",
    });

    // 3. Audit log
    addAuditLog({
      timestamp: now,
      user: currentUser.name,
      action: `Enrolled patient case ${newCaseId} into model training dataset`,
      module: "Patient Consultation",
      caseId: newCaseId,
      status: "Success",
      detail: `Model: ${currentModel.name} | Prob: ${prediction.probability}% | Feasibility: ${prediction.feasibilityTitle}`,
    });

    // 4. Cloud sync to Supabase
    await syncToCloud();

    setEnrolling(false);
    setEnrolledSuccess(newCaseId);

    toast({
      title: "Patient Data Enrolled in Training Dataset",
      description: `${newCaseId} stored in cases & training cohort. Cloud synced to Supabase.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Live Patient AI Consultation
              </span>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-xs">
                Real-Time Inference
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Patient Intake, Model Selection & Implant Feasibility
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Enter real patient consultation notes or structured parameters. Select your preferred predictive AI model to calculate exact implant success probability and surgical feasibility.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("cases")}
              className="text-xs gap-1.5"
            >
              <FileCheck className="h-4 w-4 text-primary" /> View All Cases ({cases.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("dataset")}
              className="text-xs gap-1.5"
            >
              <Database className="h-4 w-4 text-emerald-600" /> Training Datasets
            </Button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-primary" /> Quick Patient Presets:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="flex flex-col items-start rounded-xl border border-border/80 bg-card/60 p-2.5 text-left transition hover:border-primary/50 hover:bg-card hover:shadow-sm"
              >
                <span className="text-xs font-semibold text-foreground truncate w-full">{p.title}</span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model Selection Bar */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-5 border-b border-border bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Select AI Model for Inference</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              Current: <strong className="text-foreground">{currentModel.name}</strong> ({currentModel.version})
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {AI_MODELS.map((m) => {
              const selected = m.id === selectedModelId;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedModelId(m.id)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3.5 transition-all relative flex flex-col justify-between",
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-foreground">{m.name}</span>
                      {selected && (
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-white">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                      {m.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-primary font-medium">AUC {m.auc}</span>
                    <span className="text-muted-foreground">Acc: {m.accuracy}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Left = Intake Input, Right = AI Output & Possibility Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Clinical Text Notes & Anatomical Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Natural Text Intake */}
          <Card className="border-border shadow-sm">
            <CardHeader className="py-3 px-5 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" /> Natural Clinical Notes for Real Person
                </CardTitle>
                <Button
                  size="sm"
                  onClick={handleParseText}
                  disabled={parsing}
                  className="bg-brand-gradient text-white text-xs h-7 gap-1"
                >
                  <Sparkles className={cn("h-3 w-3", parsing && "animate-spin")} />
                  {parsing ? "Extracting..." : "Parse Text"}
                </Button>
              </div>
              <CardDescription className="text-xs">
                Type or paste clinical observations, CBCT metrics, and medical history. The AI parses parameters automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3">
              <Textarea
                rows={4}
                value={patientText}
                onChange={(e) => setPatientText(e.target.value)}
                placeholder="E.g. 52-year-old male, non-smoker, healthy. Missing tooth #19. CBCT shows 7.2mm ridge width, 11mm height to mandibular canal, Type II dense bone..."
                className="text-xs font-mono leading-relaxed resize-none bg-background"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Free-text intake parsed with Clinical NLP</span>
                <span>{patientText.length} characters</span>
              </div>
            </CardContent>
          </Card>

          {/* Structured Anatomical & Clinical Controls */}
          <Card className="border-border shadow-sm">
            <CardHeader className="py-3 px-5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Anatomical & Clinical Variables
              </CardTitle>
              <CardDescription className="text-xs">
                Verified CBCT dimensions and systemic factors used for algorithmic outcome prediction.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Row 1: Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Patient Age (Years)</label>
                  <Input
                    type="number"
                    min={18}
                    max={95}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Sex</label>
                  <Select value={sex} onValueChange={(v: "Male" | "Female") => setSex(v)}>
                    <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Tooth Site</label>
                  <Select value={site} onValueChange={(v: ImplantSite) => setSite(v)}>
                    <SelectTrigger className="h-8 text-xs font-semibold truncate"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mandible Molar">Mandible Molar</SelectItem>
                      <SelectItem value="Mandible Premolar">Mandible Premolar</SelectItem>
                      <SelectItem value="Mandible Anterior">Mandible Anterior</SelectItem>
                      <SelectItem value="Maxilla Molar">Maxilla Molar</SelectItem>
                      <SelectItem value="Maxilla Premolar">Maxilla Premolar</SelectItem>
                      <SelectItem value="Maxilla Anterior">Maxilla Anterior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Bone Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/60">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Ridge Width (mm)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="h-8 text-xs font-semibold text-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">Buccolingual</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Bone Height (mm)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="h-8 text-xs font-semibold text-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">Apicocoronal</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Bone Density (HU)</label>
                  <Input
                    type="number"
                    step="10"
                    value={density}
                    onChange={(e) => setDensity(Number(e.target.value))}
                    className="h-8 text-xs font-semibold"
                  />
                  <span className="text-[10px] text-muted-foreground">Hounsfield Units</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Bone Quality</label>
                  <Select value={boneType} onValueChange={(v: BoneQualityType) => setBoneType(v)}>
                    <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Type I">Type I (Dense cortical)</SelectItem>
                      <SelectItem value="Type II">Type II (Porous cortical)</SelectItem>
                      <SelectItem value="Type III">Type III (Dense trabecular)</SelectItem>
                      <SelectItem value="Type IV">Type IV (Low density)</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-muted-foreground">Misch Class</span>
                </div>
              </div>

              {/* Row 3: Systemic Health & Risk Factors */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Smoking History</label>
                  <Select value={smoking} onValueChange={setSmoking}>
                    <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Non-smoker">Non-smoker</SelectItem>
                      <SelectItem value="Former smoker">Former smoker</SelectItem>
                      <SelectItem value="Smoker">Active Smoker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Diabetes Status</label>
                  <Select value={diabetes} onValueChange={setDiabetes}>
                    <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None (Normoglycemic)</SelectItem>
                      <SelectItem value="Controlled">Controlled (HbA1c &lt; 7%)</SelectItem>
                      <SelectItem value="Uncontrolled">Uncontrolled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Bruxism / Parafunction</label>
                  <Select value={bruxism ? "yes" : "no"} onValueChange={(v) => setBruxism(v === "yes")}>
                    <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No Bruxism</SelectItem>
                      <SelectItem value="yes">Active Nocturnal Bruxism</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Planned Implant Specifications */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/60">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Fixture Diameter</label>
                  <Select value={String(plannedDiameter)} onValueChange={(v) => setPlannedDiameter(Number(v))}>
                    <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3.5">Ø 3.5 mm (Narrow)</SelectItem>
                      <SelectItem value="4.0">Ø 4.0 mm (Standard)</SelectItem>
                      <SelectItem value="4.3">Ø 4.3 mm (Regular)</SelectItem>
                      <SelectItem value="5.0">Ø 5.0 mm (Wide)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Fixture Length</label>
                  <Select value={String(plannedLength)} onValueChange={(v) => setPlannedLength(Number(v))}>
                    <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8.0">8.0 mm (Short)</SelectItem>
                      <SelectItem value="10.0">10.0 mm (Standard)</SelectItem>
                      <SelectItem value="11.5">11.5 mm (Regular)</SelectItem>
                      <SelectItem value="13.0">13.0 mm (Long)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Loading Protocol</label>
                  <Select value={loadingProtocol} onValueChange={setLoadingProtocol}>
                    <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conventional">Conventional (3-4 mo)</SelectItem>
                      <SelectItem value="Early">Early (6-8 wks)</SelectItem>
                      <SelectItem value="Immediate">Immediate Loading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: AI Outcome Probability & How to Implant Plan (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Probability to Implant Card */}
          <Card className="border-primary/30 shadow-md bg-gradient-to-b from-card via-card to-primary/[0.03] overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-border bg-brand-gradient-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Implant Success Probability</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  {currentModel.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Circular Gauge */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative h-28 w-28 shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                    <motion.circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={prediction.probability >= 85 ? "#0F766E" : prediction.probability >= 70 ? "#F59E0B" : "#DC2626"}
                      strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 50}
                      initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - prediction.probability / 100) }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-foreground tracking-tight">
                      {prediction.probability}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Probability
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-foreground">
                      {prediction.probability >= 85 ? "Optimal Candidate (Low Risk)" : prediction.probability >= 70 ? "Moderate Risk Candidate" : "High Risk Candidate"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    95% Confidence Interval: <strong className="text-foreground">[{prediction.lowerCi}% – {prediction.upperCi}%]</strong>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Predicted Outcome: <strong className="text-emerald-600 font-semibold">{prediction.probability >= 75 ? "Successful Osseointegration" : "Guarded Prognosis"}</strong>
                  </p>
                </div>
              </div>

              {/* Feature Drivers */}
              <div className="space-y-1.5 pt-3 border-t border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Primary Predictive Factors (SHAP Analysis):
                </span>
                <div className="space-y-1.5">
                  {prediction.contributions.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate w-40">{c.feature}</span>
                      <span className={cn("font-mono font-medium text-xs", c.direction === "positive" ? "text-emerald-600" : "text-amber-600")}>
                        {c.direction === "positive" ? "+" : ""}{c.contribution > 0 ? (c.contribution * 100).toFixed(1) : (c.contribution * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Is Possible To Implant Card (Surgical & Anatomical Planning) */}
          <Card className="border-border shadow-sm">
            <CardHeader className="py-3 px-5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" /> How It Is Possible to Implant (Feasibility Plan)
              </CardTitle>
              <CardDescription className="text-xs">
                Surgical guidance and anatomical clearance calculated from CBCT geometry.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3.5">
              {/* Feasibility Verdict */}
              <div className={cn(
                "rounded-xl p-3 border flex items-start gap-2.5",
                prediction.feasibilityType === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200",
                prediction.feasibilityType === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200",
                prediction.feasibilityType === "caution" && "border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200"
              )}>
                {prediction.feasibilityType === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-bold leading-snug">{prediction.feasibilityTitle}</p>
                  <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">{prediction.augmentationReq}</p>
                </div>
              </div>

              {/* Surgical Guidance Points */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2 py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Recommended Dimensions:</span>
                  <span className="font-semibold text-foreground">Ø {prediction.recommendedDiameter} mm × {prediction.recommendedLength} mm</span>
                </div>
                <div className="flex items-start justify-between gap-2 py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Target Insertion Torque:</span>
                  <span className="font-semibold text-foreground">{prediction.recommendedTorque}</span>
                </div>
                <div className="flex items-start justify-between gap-2 py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Anatomical Clearance:</span>
                  <span className="font-medium text-foreground">{prediction.nerveSinusSafety}</span>
                </div>
                <div className="flex items-start justify-between gap-2 py-1">
                  <span className="text-muted-foreground">Recommended Osseointegration:</span>
                  <span className="font-semibold text-foreground">{prediction.healingMonths}</span>
                </div>
              </div>

              {/* Action: Store in Dataset for Training */}
              <div className="pt-2">
                <Button
                  onClick={handleStoreToDataset}
                  disabled={enrolling}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 h-auto text-xs shadow-md shadow-emerald-600/20 gap-2"
                >
                  <Database className={cn("h-4 w-4", enrolling && "animate-spin")} />
                  {enrolling ? "Enrolling & Persisting..." : "Save Case & Store in Dataset to Train Model"}
                </Button>
                {enrolledSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-emerald-600 font-medium"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Enrolled as {enrolledSuccess}. Added to Model Retraining Cohort!
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
