"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Plus, Check, X, Cpu, Database, Layers, Activity, Sparkles, Save, Info } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { AiProcessingCore } from "@/components/ai/ai-processing-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ModelAlgorithm, ModelVersion, ModelStatus } from "@/lib/types";

const ALGORITHMS: ModelAlgorithm[] = ["Logistic Regression", "Random Forest", "XGBoost"];

const ALL_FEATURES = [
  "Bone Density (HU)",
  "Bone Quality",
  "Cortical Bone Thickness",
  "Buccolingual Width",
  "Apicocoronal Height",
  "Smoking Status",
  "Diabetes Status",
  "Bruxism",
  "Implant Length",
  "Loading Protocol",
];

const TRAIN_STAGES = [
  "Loading dataset",
  "Data validation",
  "Preprocessing",
  "Feature engineering",
  "5-fold cross-validation",
  "Model training",
  "Test-set evaluation",
  "Model serialization",
];

type Mode = "idle" | "config" | "training" | "results";

export function ModelTrainWizard() {
  const { addModel, addAuditLog, currentUser, datasets, cases } = useAppStore();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("idle");
  const [quickAdd, setQuickAdd] = React.useState(false);

  // config
  const [algorithm, setAlgorithm] = React.useState<ModelAlgorithm>("XGBoost");
  const [version, setVersion] = React.useState("1.1");
  const [datasetVersion, setDatasetVersion] = React.useState("dataset_v1 (128 records, synthetic)");
  const [features, setFeatures] = React.useState<string[]>([...ALL_FEATURES]);
  const [validation, setValidation] = React.useState("5-fold stratified cross-validation");
  const [status, setStatus] = React.useState<ModelStatus>("Development");

  // training
  const [stageIdx, setStageIdx] = React.useState(0);
  const [results, setResults] = React.useState<ModelVersion["metrics"] | null>(null);

  function openTrain() {
    setQuickAdd(false);
    setMode("config");
    setOpen(true);
  }
  function openAdd() {
    setQuickAdd(true);
    setMode("config");
    setOpen(true);
  }

  function reset() {
    setMode("config");
    setStageIdx(0);
    setResults(null);
  }

  function toggleFeature(f: string) {
    setFeatures((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]));
  }

  function genSyntheticMetrics(): NonNullable<ModelVersion["metrics"]> {
    // deterministic-ish synthetic metrics per algorithm (DEMO)
    const base: Record<ModelAlgorithm, number> = {
      "Logistic Regression": 0.71,
      "Random Forest": 0.77,
      XGBoost: 0.82,
    };
    const auc = base[algorithm] + (Math.random() * 0.03 - 0.015);
    const acc = auc - 0.01;
    const sens = auc - 0.04;
    const spec = auc + 0.01;
    const prec = auc - 0.06;
    const f1 = auc - 0.05;
    const tp = Math.round(62 + (auc - 0.78) * 50);
    const tn = Math.round(63 + (auc - 0.78) * 40);
    const fp = Math.max(8, 16 - Math.round((auc - 0.78) * 40));
    const fn = Math.max(8, 17 - Math.round((auc - 0.78) * 30));
    const roc = Array.from({ length: 41 }, (_, i) => {
      const fpr = i / 40;
      const tpr = Math.min(1, Math.max(fpr, 1 - Math.pow(1 - fpr, 1 / (auc / (1 - 0.5 + 1e-9)))));
      return { fpr, tpr: parseFloat(tpr.toFixed(3)) };
    });
    return {
      accuracy: parseFloat(acc.toFixed(3)),
      sensitivity: parseFloat(sens.toFixed(3)),
      specificity: parseFloat(spec.toFixed(3)),
      precision: parseFloat(prec.toFixed(3)),
      f1: parseFloat(f1.toFixed(3)),
      rocAuc: parseFloat(auc.toFixed(3)),
      confusionMatrix: { tp, fp, fn, tn },
      rocCurve: roc,
      prCurve: [
        { recall: 0, precision: 0.5 },
        { recall: 0.4, precision: parseFloat((0.74 + Math.random() * 0.06).toFixed(3)) },
        { recall: 0.7, precision: parseFloat((0.6 + Math.random() * 0.05).toFixed(3)) },
        { recall: 1, precision: 0.42 },
      ],
      calibration: [
        { predicted: 0.2, actual: 0.25 },
        { predicted: 0.5, actual: 0.52 },
        { predicted: 0.8, actual: 0.74 },
      ],
    };
  }

  function startTraining() {
    setMode("training");
    setStageIdx(0);
    setResults(null);
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i < TRAIN_STAGES.length) {
        setStageIdx(i);
      } else {
        clearInterval(t);
        const m = genSyntheticMetrics();
        setResults(m);
        setMode("results");
      }
    }, 700);
  }

  function register() {
    const id = `model_${algorithm.split(" ")[0].toLowerCase()}_${version.replace(/\./g, "_")}_${Date.now().toString().slice(-5)}`;
    const model: ModelVersion = {
      id,
      modelId: id,
      version,
      algorithm,
      status,
      trainingDatasetVersion: datasetVersion,
      featureList: features,
      trainedAt: new Date().toISOString(),
      validationStrategy: validation,
      rocAuc: results?.rocAuc ?? null,
      metrics: results,
      fileLocation: `/models/${id}.joblib (demo path)`,
    };
    addModel(model);
    addAuditLog({
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      action: quickAdd ? "Registered model" : "Trained model",
      module: "ML Pipeline",
      caseId: null,
      status: "Success",
      detail: `${algorithm} v${version} · ROC-AUC ${results?.rocAuc?.toFixed(2) ?? "—"} (DEMO)`,
    });
    setOpen(false);
    setTimeout(reset, 200);
    toast({
      title: quickAdd ? "Model registered" : "Model trained & registered",
      description: `${algorithm} v${version} added to the registry${results ? ` · ROC-AUC ${results.rocAuc.toFixed(2)}` : ""}.`,
    });
  }

  function registerQuick() {
    const id = `model_${algorithm.split(" ")[0].toLowerCase()}_${version.replace(/\./g, "_")}_${Date.now().toString().slice(-5)}`;
    const model: ModelVersion = {
      id,
      modelId: id,
      version,
      algorithm,
      status,
      trainingDatasetVersion: datasetVersion,
      featureList: features,
      trainedAt: null,
      validationStrategy: validation,
      rocAuc: null,
      metrics: null,
      fileLocation: `/models/${id}.joblib (registered, not trained)`,
    };
    addModel(model);
    addAuditLog({
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      action: "Registered model",
      module: "ML Pipeline",
      caseId: null,
      status: "Success",
      detail: `${algorithm} v${version} registered (not trained)`,
    });
    setOpen(false);
    setTimeout(reset, 200);
    toast({ title: "Model registered", description: `${algorithm} v${version} added to the registry.` });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Model
        </Button>
        <Button size="sm" className="bg-brand-gradient text-white" onClick={openTrain}>
          <Brain className="h-4 w-4" /> Train Model
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 200); }}>
        <DialogContent className="max-h-[100dvh] w-[calc(100%-1rem)] max-w-3xl gap-0 overflow-hidden p-0 sm:rounded-2xl [&>button]:right-3 [&>button]:top-3">
          <DialogHeader className="border-b border-border bg-brand-gradient-soft px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              {quickAdd ? <Plus className="h-4 w-4 text-primary" /> : <Brain className="h-4 w-4 text-primary" />}
              {quickAdd ? "Register Model" : "Train Research Model"}
            </DialogTitle>
            <DialogDescription>
              {quickAdd ? "Register a model in the registry (not trained)." : "Run the ML training pipeline (DEMO — synthetic metrics)."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto scrollbar-medical px-6 py-5">
            <AnimatePresence mode="wait">
              {mode === "config" && (
                <motion.div key="config" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Algorithm</Label>
                      <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as ModelAlgorithm)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ALGORITHMS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Version</Label>
                      <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1.1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Dataset version</Label>
                      <Select value={datasetVersion} onValueChange={setDatasetVersion}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {datasets.map((d) => <SelectItem key={d.id} value={`${d.name} (${d.records} records, synthetic)`}>{d.name}</SelectItem>)}
                          <SelectItem value="dataset_v1 (128 records, synthetic)">retrospective_implant_v1.csv</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Validation strategy</Label>
                      <Select value={validation} onValueChange={setValidation}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5-fold stratified cross-validation">5-fold stratified CV</SelectItem>
                          <SelectItem value="10-fold stratified cross-validation">10-fold stratified CV</SelectItem>
                          <SelectItem value="Hold-out (80/20)">Hold-out 80/20</SelectItem>
                          <SelectItem value="Nested cross-validation">Nested CV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Initial status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as ModelStatus)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Development">Development</SelectItem>
                          <SelectItem value="Validated">Validated</SelectItem>
                          <SelectItem value="Not Available">Not Available</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Feature set (research data dictionary)</Label>
                      <button onClick={() => setFeatures(features.length === ALL_FEATURES.length ? [] : [...ALL_FEATURES])} className="text-[11px] text-primary hover:underline">
                        {features.length === ALL_FEATURES.length ? "Clear all" : "Select all"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border p-2 sm:grid-cols-2">
                      {ALL_FEATURES.map((f) => (
                        <label key={f} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60">
                          <Checkbox checked={features.includes(f)} onCheckedChange={() => toggleFeature(f)} />
                          <span>{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {!quickAdd && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                      <Info className="h-3.5 w-3.5 mt-0.5" /> Training runs a synthetic demonstration pipeline. Metrics are demo values, not validated clinical performance. Only features available at the prediction time are used.
                    </div>
                  )}
                </motion.div>
              )}

              {mode === "training" && (
                <motion.div key="training" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AiProcessingCore
                    stage="extracting"
                    label="Training model"
                    sublabel={TRAIN_STAGES[stageIdx]}
                    steps={TRAIN_STAGES}
                    currentStepIndex={stageIdx}
                    demo
                  />
                </motion.div>
              )}

              {mode === "results" && results && (
                <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Training complete</p>
                      <p className="text-xs text-muted-foreground">{algorithm} v{version} · {validation}</p>
                    </div>
                    <Badge className="ml-auto bg-cyan-100 text-cyan-700"><Sparkles className="h-3 w-3" /> DEMO metrics</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { l: "Accuracy", v: results.accuracy },
                      { l: "Sensitivity", v: results.sensitivity },
                      { l: "Specificity", v: results.specificity },
                      { l: "Precision", v: results.precision },
                      { l: "F1", v: results.f1 },
                      { l: "ROC-AUC", v: results.rocAuc },
                    ].map((m) => (
                      <div key={m.l} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.l}</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{(m.v * 100).toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      { l: "TP", v: results.confusionMatrix.tp, c: "bg-emerald-100 text-emerald-700" },
                      { l: "FP", v: results.confusionMatrix.fp, c: "bg-amber-100 text-amber-700" },
                      { l: "FN", v: results.confusionMatrix.fn, c: "bg-orange-100 text-orange-700" },
                      { l: "TN", v: results.confusionMatrix.tn, c: "bg-teal-100 text-teal-700" },
                    ].map((c) => (
                      <div key={c.l} className={cn("rounded-lg p-2", c.c)}>
                        <p className="text-[10px]">{c.l}</p>
                        <p className="text-lg font-bold">{c.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                    <Info className="h-3.5 w-3.5 mt-0.5" /> These are synthetic demonstration metrics. Do not interpret as validated research findings.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter className="border-t border-border px-6 py-3">
            {mode === "config" && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                {quickAdd ? (
                  <Button size="sm" className="bg-brand-gradient text-white" onClick={registerQuick}>
                    <Save className="h-4 w-4" /> Register Model
                  </Button>
                ) : (
                  <Button size="sm" className="bg-brand-gradient text-white" onClick={startTraining} disabled={features.length === 0}>
                    <Brain className="h-4 w-4" /> Start Training
                  </Button>
                )}
              </>
            )}
            {mode === "training" && (
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel training</Button>
            )}
            {mode === "results" && (
              <>
                <Button variant="outline" size="sm" onClick={reset}><Activity className="h-4 w-4" /> Retrain</Button>
                <Button size="sm" className="bg-brand-gradient text-white" onClick={register}><Save className="h-4 w-4" /> Register Trained Model</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
