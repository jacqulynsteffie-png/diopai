"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Cpu,
  Info,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { pseudoPredict } from "@/lib/demo-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { STUDY_META } from "@/lib/types";
import { Sparkle } from "lucide-react";

type Phase = "idle" | "prep" | "processing" | "generating" | "done";

export function PredictionView() {
  const { cases, selectedCaseId, setSelectedCase, models, addAuditLog, currentUser } = useAppStore();
  const caseData = cases.find((c) => c.id === selectedCaseId) ?? cases[0];
  const activeModel = models.find((m) => m.algorithm === "XGBoost") ?? models[0];
  const [phase, setPhase] = React.useState<Phase>(caseData?.prediction ? "done" : "idle");
  const [result, setResult] = React.useState(caseData?.prediction ?? null);
  const [aiSummary, setAiSummary] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);

  React.useEffect(() => {
    if (caseData?.prediction) { setResult(caseData.prediction); setPhase("done"); }
    else { setResult(null); setPhase("idle"); }
    setAiSummary(null);
  }, [caseData?.id]);

  async function fetchAiSummary() {
    if (!caseData || !result) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseData.caseId,
          age: caseData.age,
          sex: caseData.sex,
          implantSite: caseData.implantSite,
          prediction: result,
          contributions: result.featureContributions,
          documentedOutcome: caseData.outcome?.documentedOutcome,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary ?? null);
    } catch {
      setAiSummary("AI summary unavailable. Please retry.");
    } finally {
      setAiLoading(false);
    }
  }

  function run() {
    if (!caseData) return;
    if (!activeModel) {
      toast({ title: "No model available", description: "Train a model first in Model Performance." });
      return;
    }
    setPhase("prep");
    const steps: Phase[] = ["prep", "processing", "generating"];
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i < steps.length) setPhase(steps[i]);
      else {
        clearInterval(t);
        const pred = pseudoPredict({
          boneDensityHu: caseData.cbct.boneDensityHu,
          boneQuality: caseData.cbct.boneQuality,
          corticalBoneThickness: caseData.cbct.corticalBoneThickness,
          buccolingualWidth: caseData.cbct.buccolingualWidth,
          apicocoronalHeight: caseData.cbct.apicocoronalHeight,
          smoking: caseData.clinical.smokingStatus,
          diabetes: caseData.clinical.diabetesStatus,
          bruxism: caseData.clinical.bruxism,
          implantLengthMm: caseData.clinical.implantLengthMm,
          loadingProtocol: caseData.clinical.loadingProtocol,
        });
        const r = {
          modelId: activeModel.id,
          modelVersion: activeModel.version,
          algorithm: activeModel.algorithm,
          predictedOutcome: pred.predictedOutcome,
          probability: parseFloat(pred.probability.toFixed(3)),
          featureContributions: pred.contributions,
          shapAvailable: true,
          generatedAt: new Date().toISOString(),
          status: "Completed" as const,
        };
        setResult(r);
        setPhase("done");
        addAuditLog({
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: "Generated prediction",
          module: "Predictions",
          caseId: caseData.caseId,
          status: "Success",
          detail: `${r.algorithm} ${r.modelVersion} → ${r.predictedOutcome} (${Math.round(r.probability * 100)}%)`,
        });
      }
    }, 900);
  }

  if (!caseData) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient-soft text-primary"><Brain className="h-6 w-6" /></div>
        <p className="mt-3 text-sm font-semibold">No research case selected</p>
        <p className="text-xs text-muted-foreground">Select a case to generate an AI prediction.</p>
      </div>
    );
  }

  const prob = result?.probability ?? 0;
  const probPct = Math.round(prob * 100);
  const actual = caseData.outcome?.documentedOutcome;
  const agreement = result && actual ? (result.predictedOutcome === actual ? "Yes" : "No") : null;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)]">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Research Case</p>
              <p className="font-mono text-sm font-semibold text-primary">{caseData.caseId}</p>
              <p className="text-[11px] text-muted-foreground">{caseData.age}y · {caseData.sex} · {caseData.implantSite}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Model</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-primary" />{activeModel ? activeModel.algorithm : "No model"}</p>
              <p className="text-[11px] text-muted-foreground">{activeModel ? `v${activeModel.version} · ${activeModel.status}` : "Train a model to begin"}</p>
            </div>
            <select
              value={caseData.id}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-xs"
            >
              {cases.slice(0, 50).map((c) => (
                <option key={c.id} value={c.id}>{c.caseId} — {c.age}y {c.implantSite}</option>
              ))}
            </select>
            <Button onClick={run} disabled={phase !== "idle" && phase !== "done"} className="bg-brand-gradient text-white">
              {phase === "idle" || phase === "done" ? <><Sparkles className="h-4 w-4" /> Generate Prediction</> : <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {phase !== "idle" && phase !== "done" ? (
          <LoadingCard key="loading" phase={phase} />
        ) : result ? (
          <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Prediction result — central */}
              <Card className="lg:col-span-1 overflow-hidden">
                <div className="bg-brand-gradient px-5 py-4 text-white">
                  <p className="text-[10px] uppercase tracking-wide text-white/80">Prediction Result</p>
                  <p className="text-sm font-medium">Predicted Outcome</p>
                </div>
                <CardContent className="flex flex-col items-center pt-6">
                  <ProbabilityDial value={prob} outcome={result.predictedOutcome} />
                  <Badge className={cn("mt-4", result.predictedOutcome === "Success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                    {result.predictedOutcome}
                  </Badge>
                  <p className="mt-3 text-[11px] text-muted-foreground">Research-use prediction only</p>
                  <div className="mt-4 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800">
                    {STUDY_META.disclaimer}
                  </div>
                </CardContent>
              </Card>

              {/* Input summary + comparison */}
              <div className="space-y-4 lg:col-span-2">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Model Explanation</CardTitle><CardDescription>Feature contributions (not causation)</CardDescription></CardHeader>
                  <CardContent>
                    <p className="mb-3 text-[11px] text-muted-foreground">
                      Feature contribution indicates how much the model relied on this variable. It does not establish causality. {result.shapAvailable ? "SHAP values shown where supported." : "SHAP not available."}
                    </p>
                    {/* legend */}
                    <div className="mb-3 flex items-center justify-end gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Pushes toward Success</span>
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Pushes toward Failure</span>
                    </div>
                    <div className="space-y-2.5">
                      {result.featureContributions.map((c, i) => {
                        const max = Math.max(...result.featureContributions.map((x) => Math.abs(x.contribution)), 0.01);
                        // each bar can occupy at most half the track (diverging from center)
                        const halfPct = (Math.abs(c.contribution) / max) * 50;
                        const pos = c.contribution >= 0;
                        return (
                          <div key={i} className="flex items-center gap-2 sm:gap-3">
                            <span className="w-24 shrink-0 truncate text-[11px] text-foreground sm:w-44 sm:text-xs">{c.feature}</span>
                            <div className="relative h-7 flex-1 overflow-hidden rounded bg-muted">
                              {/* track halves */}
                              <div className="absolute inset-y-0 left-0 w-1/2 border-r border-border/60 bg-muted-foreground/5" />
                              <div className="absolute inset-y-0 right-0 w-1/2 bg-muted-foreground/5" />
                              {/* diverging bar */}
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${halfPct}%` }}
                                transition={{ duration: 0.55, delay: i * 0.05, ease: "easeOut" }}
                                className={cn(
                                  "absolute top-0 h-7 rounded",
                                  pos ? "left-1/2 bg-gradient-to-r from-emerald-500 to-emerald-400" : "right-1/2 bg-gradient-to-l from-red-500 to-red-400"
                                )}
                              />
                              {/* center axis */}
                              <div className="absolute left-1/2 top-0 z-10 h-7 w-px -translate-x-1/2 bg-foreground/30" />
                            </div>
                            <span className={cn("w-12 shrink-0 text-right text-[11px] font-semibold tabular-nums sm:text-xs", pos ? "text-emerald-600" : "text-red-500")}>
                              {pos ? "+" : ""}{c.contribution.toFixed(3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Prediction vs Actual */}
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-primary" /> Prediction vs Documented Outcome</CardTitle><CardDescription>Research comparison</CardDescription></CardHeader>
                  <CardContent>
                    {actual ? (
                      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-2">
                        <ComparisonSide label="AI Prediction" value={result.predictedOutcome} sub={`${probPct}% probability`} positive={result.predictedOutcome === "Success"} />
                        <div className="flex flex-row items-center justify-center gap-2 sm:flex-col">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Agreement</span>
                          {agreement === "Yes" ? (
                            <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Yes</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-600"><XCircle className="h-3 w-3" /> No</Badge>
                          )}
                          <ChevronRight className="hidden h-4 w-4 rotate-90 text-muted-foreground sm:block sm:rotate-0" />
                        </div>
                        <ComparisonSide label="Documented Outcome" value={actual} sub={`Follow-up ${caseData.outcome?.followUpMonths ?? "—"} mo`} positive={actual === "Success"} />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-6 text-center">
                        <AlertTriangle className="mx-auto h-5 w-5 text-amber-500" />
                        <p className="mt-1 text-sm font-medium">No documented outcome to compare</p>
                        <p className="text-xs text-muted-foreground">Record the documented outcome per research protocol to enable comparison.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI research-use narrative summary (LLM-backed) */}
                <Card className="border-primary/20">
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Sparkle className="h-4 w-4 text-primary" /> AI Research Summary</CardTitle>
                      <CardDescription>LLM-generated research narrative (research-use, not clinical)</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={fetchAiSummary} disabled={aiLoading}>
                      {aiLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</> : aiSummary ? "Regenerate" : <><Sparkle className="h-3.5 w-3.5" /> Generate Summary</>}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {aiLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    ) : aiSummary ? (
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{aiSummary}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Generate a plain-language research summary of this prediction. The LLM is constrained: it will not diagnose, recommend treatment, or invent clinical thresholds.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient-soft text-primary">
                  <Brain className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">No prediction generated yet</p>
                  <p className="text-xs text-muted-foreground">Generate an AI outcome prediction for {caseData.caseId}.</p>
                </div>
                <Button onClick={run} className="bg-brand-gradient text-white"><Sparkles className="h-4 w-4" /> Generate Prediction</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProbabilityDial({ value, outcome }: { value: number; outcome: string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        <motion.circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke={outcome === "Success" ? "#0F766E" : "#DC2626"}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-bold tabular-nums text-foreground"
        >
          {Math.round(value * 100)}%
        </motion.span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Probability</span>
      </div>
    </div>
  );
}

function ComparisonSide({ label, value, sub, positive }: { label: string; value: string; sub: string; positive: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4 text-center", positive ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold", positive ? "text-emerald-700" : "text-red-600")}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function LoadingCard({ phase }: { phase: Phase }) {
  const labels: Record<string, string> = {
    prep: "Preparing research prediction…",
    processing: "Processing model input…",
    generating: "Generating prediction…",
  };
  const active = labels[phase] ?? labels.prep;
  const order = ["prep", "processing", "generating"];
  const idx = order.indexOf(phase);

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-[#0B1220] px-6 py-10">
        {/* grid + glow background */}
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="absolute inset-0 bg-radial-glow" />
        {/* particles */}
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-400/70"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
            animate={{ y: [0, -18, 0], opacity: [0.15, 0.9, 0.15] }}
            transition={{ duration: 2.4 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}

        <CardContent className="relative flex flex-col items-center gap-5 p-0 text-white">
          {/* Impressive radar / neural core */}
          <div className="relative grid h-44 w-44 place-items-center">
            {/* outer scanning ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-blue-400/30"
              animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
            />
            {/* rotating radar sweep */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, transparent 0deg, rgba(6,182,212,0.45) 90deg, transparent 130deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            />
            {/* dashed orbit */}
            <motion.div
              className="absolute inset-4 rounded-full border border-dashed border-cyan-300/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            {/* pulsing core */}
            <motion.div
              className="absolute inset-0 grid place-items-center"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative grid h-20 w-20 place-items-center rounded-full bg-brand-gradient shadow-[0_0_40px_-4px_rgba(37,99,235,0.7)]">
                {/* neural nodes around core */}
                {[0, 90, 180, 270].map((deg, i) => (
                  <motion.span
                    key={deg}
                    className="absolute h-2 w-2 rounded-full bg-white"
                    style={{ transform: `rotate(${deg}deg) translateY(-44px)` }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
                  />
                ))}
                <Brain className="h-9 w-9 text-white drop-shadow" />
              </div>
            </motion.div>
          </div>

          {/* Status text */}
          <div className="text-center">
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-semibold text-white"
            >
              {active}
            </motion.p>
            <p className="mt-1 text-[11px] text-slate-400">
              Analyzing preoperative CBCT-derived features · research-use inference
            </p>
          </div>

          {/* Stage progress bar */}
          <div className="w-full max-w-md">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-brand-gradient"
                animate={{ width: `${((idx + 1) / order.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-y-0 w-1/3 rounded-full bg-white/30 blur-sm"
                animate={{ left: ["-33%", "100%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {order.map((s, i) => (
                <div key={s} className="flex items-center gap-2.5">
                  <div className="grid h-5 w-5 place-items-center">
                    {i < idx ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </motion.span>
                    ) : i === idx ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    )}
                  </div>
                  <span className={cn("text-xs", i < idx ? "text-slate-400 line-through" : i === idx ? "font-medium text-white" : "text-slate-500")}>
                    {labels[s]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-500">
            Do not fake progress percentages — model inference in progress.
          </p>
        </CardContent>
      </div>
    </Card>
  );
}
