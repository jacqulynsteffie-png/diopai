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
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-primary" />{activeModel.algorithm}</p>
              <p className="text-[11px] text-muted-foreground">v{activeModel.version} · {activeModel.status}</p>
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
                    <div className="space-y-2">
                      {result.featureContributions.map((c, i) => {
                        const max = Math.max(...result.featureContributions.map((x) => Math.abs(x.contribution)), 0.01);
                        const w = (Math.abs(c.contribution) / max) * 100;
                        const pos = c.contribution >= 0;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-44 truncate text-xs text-foreground">{c.feature}</span>
                            <div className="relative h-6 flex-1 rounded bg-muted">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${w}%` }}
                                transition={{ duration: 0.5, delay: i * 0.04 }}
                                className={cn("absolute top-0 h-6 rounded", pos ? "left-1/2 bg-emerald-500" : "right-1/2 bg-red-400")}
                              />
                              <div className="absolute left-1/2 top-0 h-6 w-px bg-border" />
                            </div>
                            <span className={cn("w-12 text-right text-xs font-medium tabular-nums", pos ? "text-emerald-600" : "text-red-500")}>
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
                      <div className="grid grid-cols-3 items-center gap-2">
                        <ComparisonSide label="AI Prediction" value={result.predictedOutcome} sub={`${probPct}% probability`} positive={result.predictedOutcome === "Success"} />
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Agreement</span>
                          {agreement === "Yes" ? (
                            <Badge className="mt-1 bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Yes</Badge>
                          ) : (
                            <Badge className="mt-1 bg-red-100 text-red-600"><XCircle className="h-3 w-3" /> No</Badge>
                          )}
                          <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
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
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <div className="relative h-20 w-20">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <Brain className="h-8 w-8 text-primary" />
          </div>
        </div>
        <p className="text-sm font-medium text-foreground">{active}</p>
        <p className="text-[11px] text-muted-foreground">Do not fake progress percentages — model inference in progress.</p>
        <div className="flex w-full max-w-md flex-col gap-1.5">
          {order.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-5">
                {i < idx ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : i === idx ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
              </div>
              <span className={cn("text-xs", i <= idx ? "text-foreground" : "text-muted-foreground")}>{labels[s]}</span>
            </div>
          ))}
        </div>
        <div className="w-full max-w-md space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
