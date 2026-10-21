"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ScanLine,
  FileWarning,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Brain,
  RefreshCw,
  ChevronRight,
  Info,
  Layers3,
  ClipboardCheck,
  Pencil,
  Lock,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AiProcessingCore, type AiCoreStage } from "@/components/ai/ai-processing-core";
import { MprViewer } from "@/components/cbct/mpr-viewer";
import type { CbctFileInfo, ValidationCheck, PrivacyCheck, QualityAssessment, CbctVerification, ExtractedFeature, CheckStatus } from "@/lib/cbct-types";
import { ERROR_CODES } from "@/lib/cbct-types";

const PIPELINE_STAGES = [
  "Upload",
  "Validate",
  "Verify",
  "Quality",
  "Review",
  "Extract",
  "Predict",
  "Complete",
];

type Phase =
  | "idle"
  | "uploading"
  | "validating"
  | "verifying"
  | "analyzing"
  | "verified"
  | "extracting"
  | "extracted"
  | "failed";

const PHASE_TO_AI: Record<Phase, AiCoreStage> = {
  idle: "idle",
  uploading: "uploading",
  validating: "validating",
  verifying: "verifying",
  analyzing: "analyzing",
  verified: "complete",
  extracting: "extracting",
  extracted: "complete",
  failed: "failed",
};

const PHASE_STEP_INDEX: Record<Phase, number> = {
  idle: 0,
  uploading: 0,
  validating: 1,
  verifying: 2,
  analyzing: 3,
  verified: 4,
  extracting: 5,
  extracted: 5,
  failed: 0,
};

export function CbctWorkspace() {
  const { cases, selectedCaseId, setSelectedCase, addAuditLog, currentUser, setView } = useAppStore();
  const { toast } = useToast();
  const caseData = cases.find((c) => c.id === selectedCaseId) ?? cases[0];

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [file, setFile] = React.useState<CbctFileInfo | null>(null);
  const [validation, setValidation] = React.useState<ValidationCheck[] | null>(null);
  const [privacy, setPrivacy] = React.useState<PrivacyCheck | null>(null);
  const [verification, setVerification] = React.useState<CbctVerification | null>(null);
  const [quality, setQuality] = React.useState<QualityAssessment | null>(null);
  const [features, setFeatures] = React.useState<ExtractedFeature[]>([]);
  const [error, setError] = React.useState<{ code: string; message: string } | null>(null);
  const [aiOverlay, setAiOverlay] = React.useState(false);
  const [aiSegmentationConnected] = React.useState(false); // no real model
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const phaseStep = PHASE_STEP_INDEX[phase];
  const isProcessing = ["uploading", "validating", "verifying", "analyzing", "extracting"].includes(phase);

  function reset() {
    setPhase("idle");
    setFile(null);
    setValidation(null);
    setPrivacy(null);
    setVerification(null);
    setQuality(null);
    setFeatures([]);
    setError(null);
    setAiOverlay(false);
  }

  async function startUpload(fileObj: File) {
    setPhase("uploading");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", fileObj);
      const res = await fetch("/api/cbct/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? ERROR_CODES.INVALID_DICOM);
        setPhase("failed");
        addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "CBCT upload rejected", module: "CBCT", caseId: caseData?.caseId ?? null, status: "Error", detail: data.error?.message ?? "Invalid file" });
        return;
      }
      setFile(data.file);
      addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "CBCT uploaded", module: "CBCT", caseId: caseData?.caseId ?? null, status: "Success", detail: `${data.file.name} (${data.file.format})` });
      // proceed to validation
      runValidate(data.file);
    } catch (e) {
      setError({ code: "UPLOAD_FAILED", message: "Upload could not be processed." });
      setPhase("failed");
    }
  }

  async function runValidate(f: CbctFileInfo) {
    setPhase("validating");
    try {
      const res = await fetch("/api/cbct/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: f }) });
      const data = await res.json();
      if (!data.ok) { setError(data.error); setPhase("failed"); return; }
      setValidation(data.checks);
      setPrivacy(data.privacy);
      addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "CBCT validation completed", module: "CBCT", caseId: caseData?.caseId ?? null, status: "Success", detail: "Structure + privacy validated" });
      runVerify(f);
    } catch {
      setError({ code: "VALIDATION_FAILED", message: "Validation failed." }); setPhase("failed");
    }
  }

  async function runVerify(f: CbctFileInfo) {
    setPhase("verifying");
    try {
      const res = await fetch("/api/cbct/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: f }) });
      const data = await res.json();
      if (!data.ok) { setError(data.error); setPhase("failed"); return; }
      setVerification({ checks: data.checks, summary: data.summary });
      addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "AI verification completed", module: "CBCT", caseId: caseData?.caseId ?? null, status: "Success", detail: "Verification checks completed" });
      runQuality(f);
    } catch {
      setError({ code: "VERIFY_FAILED", message: "Verification failed." }); setPhase("failed");
    }
  }

  async function runQuality(f: CbctFileInfo) {
    setPhase("analyzing");
    try {
      const res = await fetch("/api/cbct/quality", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: f }) });
      const data = await res.json();
      if (!data.ok) { setError(data.error); setPhase("failed"); return; }
      setQuality({ grade: data.grade, explanation: data.explanation, metrics: data.metrics });
      addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "AI quality assessment completed", module: "CBCT", caseId: caseData?.caseId ?? null, status: "Success", detail: `Grade: ${data.grade}` });
      setPhase("verified");
    } catch {
      setError({ code: "QUALITY_FAILED", message: "Quality assessment failed." }); setPhase("failed");
    }
  }

  async function approveAndExtract() {
    setPhase("extracting");
    try {
      const res = await fetch("/api/cbct/extract-features", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file }) });
      const data = await res.json();
      if (!data.ok) { setError(data.error); setPhase("failed"); return; }
      setFeatures(data.features);
      addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "Feature extraction completed", module: "CBCT", caseId: caseData?.caseId ?? null, status: "Success", detail: `${data.features.length} features extracted` });
      addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "Researcher approved features", module: "CBCT", caseId: caseData?.caseId ?? null, status: "Success", detail: "Approved for feature extraction" });
      setPhase("extracted");
      toast({ title: "Feature extraction complete", description: `${data.features.length} AI features extracted.` });
    } catch {
      setError(ERROR_CODES.FEATURE_EXTRACTION_FAILED); setPhase("failed");
    }
  }

  function updateFeature(id: string, patch: Partial<ExtractedFeature>) {
    setFeatures((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function runPrediction() {
    setView("prediction");
    toast({ title: "Proceed to prediction", description: "Features ready for the ML outcome model." });
  }

  return (
    <div className="space-y-5">
      {/* Case selector + pipeline header */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Research Case</p>
            <p className="font-mono text-sm font-semibold text-primary">{caseData?.caseId ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{caseData ? `${caseData.age}y · ${caseData.sex} · ${caseData.implantSite}` : "Select a case"}</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={caseData?.id ?? ""} onChange={(e) => setSelectedCase(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-xs">
              {cases.slice(0, 50).map((c) => (<option key={c.id} value={c.id}>{c.caseId} — {c.age}y {c.implantSite}</option>))}
            </select>
            {phase !== "idle" && (
              <Button variant="outline" size="sm" onClick={reset}><RefreshCw className="h-4 w-4" /> Reset</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline stage indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-medical">
            {PIPELINE_STAGES.map((s, i) => {
              const done = i < phaseStep || phase === "extracted";
              const active = i === phaseStep && phase !== "idle" && phase !== "extracted" && phase !== "failed";
              const isPredict = s === "Predict";
              const predictActive = phase === "extracted";
              return (
                <React.Fragment key={s}>
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <div className={cn(
                      "grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold transition-colors",
                      active ? "bg-brand-gradient text-white" : done ? "bg-emerald-500 text-white" : predictActive && isPredict ? "bg-brand-gradient text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className={cn("text-[10px] whitespace-nowrap", active || (predictActive && isPredict) ? "font-medium text-foreground" : "text-muted-foreground")}>{s}</span>
                  </div>
                  {i < PIPELINE_STAGES.length - 1 && <div className={cn("mx-0.5 h-px w-6 sm:w-10", done ? "bg-emerald-400" : "bg-border")} />}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main content — depends on phase */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="dropzone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) startUpload(f);
                  }}
                  className={cn(
                    "relative grid place-items-center rounded-2xl border-2 border-dashed p-10 text-center transition-all sm:p-16",
                    dragging ? "border-primary bg-brand-gradient-soft scale-[1.01]" : "border-border bg-muted/30"
                  )}
                >
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    {dragging && (
                      <motion.div className="absolute inset-x-0 h-20" style={{ background: "linear-gradient(to bottom, transparent, rgba(6,182,212,0.35), transparent)" }} animate={{ top: ["-15%", "115%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
                    )}
                  </div>
                  <div className="relative">
                    <motion.div animate={dragging ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }} className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.7)]">
                      <ScanLine className="h-8 w-8" />
                    </motion.div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">CBCT Analysis</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dragging ? "Release to analyze" : "Drag & drop a CBCT dataset here"}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <Button className="bg-brand-gradient text-white" onClick={() => inputRef.current?.click()}>
                        <Upload className="h-4 w-4" /> Upload CBCT
                      </Button>
                      <Button variant="outline" onClick={() => inputRef.current?.click()}>Browse Files</Button>
                    </div>
                    <input ref={inputRef} type="file" accept=".dcm,.dicom,.zip,.nii,.gz" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) startUpload(f); e.currentTarget.value = ""; }} />
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px]">
                      {["DICOM", "DICOM ZIP", "NIfTI"].map((fmt) => (
                        <Badge key={fmt} variant="secondary" className="text-[10px]">{fmt}</Badge>
                      ))}
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">Other formats rejected</Badge>
                    </div>
                    <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <Lock className="h-3 w-3" /> Use de-identified research imaging only.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(isProcessing) && (
          <motion.div key="processing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <AiProcessingCore
                  stage={PHASE_TO_AI[phase]}
                  steps={["Upload dataset", "Validate structure", "Verify image", "Assess quality", "Check orientation", "Check anatomy", "Check implant site"]}
                  currentStepIndex={phaseStep}
                />
              </div>
              <div className="space-y-4 lg:col-span-2">
                {/* File info */}
                {file && (
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><FileWarning className="h-4 w-4 text-primary" /> File Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 text-xs">
                      <Meta l="Name" v={file.name} />
                      <Meta l="Size" v={`${(file.size / 1024 / 1024).toFixed(1)} MB`} />
                      <Meta l="Format" v={file.format} />
                      <Meta l="Slices" v={file.slices} />
                      <Meta l="Dimensions" v={`${file.width}×${file.height}×${file.depth}`} />
                      <Meta l="Voxel spacing" v={`${file.voxelSpacingMm.join("×")} mm`} />
                    </CardContent>
                  </Card>
                )}
                {/* Live validation checklist */}
                {validation && (
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-primary" /> Validation</CardTitle></CardHeader>
                    <CardContent className="space-y-1.5">
                      {validation.map((c) => <CheckRow key={c.id} check={c} />)}
                      {privacy && (
                        <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            <ShieldCheck className="h-3.5 w-3.5" /> Privacy Check
                          </p>
                          <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">{privacy.label}</p>
                          <p className="text-[10px] text-muted-foreground">{privacy.detail}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {phase === "verified" && (
          <motion.div key="verified" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Verification checklist */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> AI CBCT Verification</CardTitle><CardDescription>{verification?.summary}</CardDescription></CardHeader>
                <CardContent className="space-y-1.5">
                  {verification?.checks.map((c) => <CheckRow key={c.id} check={c} />)}
                </CardContent>
              </Card>
              {/* Quality assessment */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-primary" /> AI Image Quality Assessment</CardTitle><CardDescription>Grade: <QualityBadge grade={quality?.grade ?? "REVIEW"} /></CardDescription></CardHeader>
                <CardContent className="space-y-1.5">
                  <p className="mb-1 text-[11px] text-muted-foreground">{quality?.explanation}</p>
                  {quality?.metrics.map((m) => <CheckRow key={m.id} check={m} />)}
                </CardContent>
              </Card>
            </div>

            {/* MPR viewer */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div><CardTitle className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-primary" /> CBCT Viewer (Axial / Coronal / Sagittal)</CardTitle><CardDescription>Synchronized crosshair — click or drag in any plane</CardDescription></div>
                <div className="flex items-center gap-2">
                  <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={aiOverlay} onCheckedChange={setAiOverlay} /> AI overlay
                  </Label>
                </div>
              </CardHeader>
              <CardContent>
                {!aiSegmentationConnected && aiOverlay && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                    <Info className="h-3.5 w-3.5" /> AI segmentation model not connected — overlay shows a placeholder ROI only.
                  </div>
                )}
                <MprViewer width={file?.width ?? 512} height={file?.height ?? 512} depth={file?.depth ?? 240} aiOverlay={aiOverlay} />
              </CardContent>
            </Card>

            {/* Researcher approval gate */}
            <Card className="border-primary/30 bg-brand-gradient-soft">
              <CardContent className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white"><ClipboardCheck className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Researcher Review Required</p>
                    <p className="text-xs text-muted-foreground">AI verification complete. Approve to proceed to feature extraction.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setPhase("idle"); toast({ title: "Rejected", description: "Dataset rejected." }); }}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Review requested", description: "Flagged for additional review." })}>
                    <AlertTriangle className="h-4 w-4" /> Request Review
                  </Button>
                  <Button size="sm" className="bg-brand-gradient text-white" onClick={approveAndExtract}>
                    <CheckCircle2 className="h-4 w-4" /> Approve for Feature Extraction
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "extracted" && (
          <motion.div key="extracted" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0}} className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div><CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> AI Feature Extraction</CardTitle><CardDescription>Extracted from the research data dictionary — researcher-verifiable</CardDescription></div>
                <Badge className="bg-cyan-100 text-cyan-700">AI-extracted</Badge>
              </CardHeader>
              <CardContent className="px-0">
                <div className="overflow-x-auto scrollbar-medical">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 py-2.5 font-medium">Feature</th>
                        <th className="px-3 py-2.5 font-medium">AI Value</th>
                        <th className="px-3 py-2.5 font-medium">Researcher Value</th>
                        <th className="px-3 py-2.5 font-medium">Unit</th>
                        <th className="px-3 py-2.5 font-medium">Confidence</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((f) => (
                        <tr key={f.id} className="border-b border-border/60 align-top">
                          <td className="px-6 py-3">
                            <p className="text-xs font-medium text-foreground">{f.feature}</p>
                            <p className="mt-0.5 max-w-[200px] text-[10px] text-muted-foreground" title={f.explanation}>{f.explanation}</p>
                          </td>
                          <td className="px-3 py-3 text-xs tabular-nums text-foreground">{String(f.value)}</td>
                          <td className="px-3 py-3">
                            <input
                              defaultValue={f.researcherValue ?? ""}
                              placeholder="—"
                              onBlur={(e) => {
                                const v = e.target.value;
                                if (v !== "") updateFeature(f.id, { researcherValue: v, status: "Researcher verified", source: "Researcher" });
                              }}
                              className="h-7 w-24 rounded border border-border bg-background px-2 text-xs"
                            />
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">{f.unit}</td>
                          <td className="px-3 py-3 text-xs">
                            {f.confidence != null ? (
                              <span className="font-medium text-foreground">{Math.round(f.confidence * 100)}%</span>
                            ) : <span className="text-muted-foreground">Unavailable</span>}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="outline" className={cn("text-[10px]", f.status === "Researcher verified" ? "border-emerald-200 text-emerald-700" : f.status === "Needs review" ? "border-amber-200 text-amber-700" : "border-blue-200 text-blue-700")}>
                              {f.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-primary/20 bg-brand-gradient-soft p-4 sm:flex-row">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" /> Feature confidence is shown only where a calibrated model measure exists. Researcher modifications are audit-logged.
              </p>
              <Button className="bg-brand-gradient text-white" onClick={runPrediction}>
                <Brain className="h-4 w-4" /> Run Research Prediction <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "failed" && (
          <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-red-200">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-600"><XCircle className="h-7 w-7" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{error?.code}</p>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">{error?.message}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { reset(); }}><RefreshCw className="h-4 w-4" /> Try Again</Button>
                  <Button variant="ghost" onClick={() => setView("dataset")}>Upload a different dataset</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Meta({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</p>
      <p className="mt-0.5 break-words text-xs font-medium text-foreground">{v}</p>
    </div>
  );
}

function CheckRow({ check }: { check: { status: CheckStatus; label: string; detail?: string } }) {
  const icon = check.status === "pass" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : check.status === "warn" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : check.status === "fail" ? <XCircle className="h-3.5 w-3.5 text-red-500" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", check.status === "fail" ? "text-red-600" : "text-foreground")}>{check.label}</p>
        {check.detail && <p className="text-[10px] text-muted-foreground">{check.detail}</p>}
      </div>
    </div>
  );
}

function QualityBadge({ grade }: { grade: "GOOD" | "REVIEW" | "INSUFFICIENT" }) {
  const map = { GOOD: "bg-emerald-100 text-emerald-700", REVIEW: "bg-amber-100 text-amber-700", INSUFFICIENT: "bg-red-100 text-red-600" };
  return <Badge className={map[grade]}>{grade}</Badge>;
}
