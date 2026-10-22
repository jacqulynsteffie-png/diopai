"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Layers,
  Cpu,
  Check,
  Activity,
  AlertTriangle,
  Copy,
  CheckCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import type { ModelVersion, ModelStatus, ModelAlgorithm, ModelMetrics } from "@/lib/types";

const AVAILABLE_FEATURES = [
  "Bone Density (HU)",
  "Bone Quality Type",
  "Cortical Bone Thickness",
  "Buccolingual Ridge Width",
  "Apicocoronal Height",
  "Sinus Floor Proximity",
  "Distance to IA Canal",
  "Smoking Status",
  "Diabetes Status",
  "Bruxism Index",
  "Implant Length & Diameter",
  "Loading Protocol",
];

// Helper to generate realistic visual curves from AUC and metrics
export function buildSyntheticMetrics(
  auc: number,
  acc: number,
  sens: number,
  spec: number,
  prec: number,
  f1: number
): ModelMetrics {
  const rocCurve: { fpr: number; tpr: number }[] = [];
  for (let i = 0; i <= 30; i++) {
    const fpr = i / 30;
    const exponent = Math.max(0.1, (1 - auc) / (auc + 0.001));
    const tpr = Math.min(1, Math.max(fpr, 1 - Math.pow(1 - fpr, 1 / (exponent + 0.5))));
    rocCurve.push({ fpr: Number(fpr.toFixed(3)), tpr: Number(tpr.toFixed(3)) });
  }
  rocCurve[0] = { fpr: 0, tpr: 0 };
  rocCurve[rocCurve.length - 1] = { fpr: 1, tpr: 1 };

  return {
    accuracy: acc,
    sensitivity: sens,
    specificity: spec,
    precision: prec,
    f1: f1,
    rocAuc: auc,
    confusionMatrix: {
      tp: Math.round(sens * 80),
      fp: Math.round((1 - spec) * 48),
      fn: Math.round((1 - sens) * 80),
      tn: Math.round(spec * 48),
    },
    rocCurve,
    prCurve: [
      { recall: 0, precision: prec },
      { recall: 0.25, precision: Math.min(1, prec + 0.05) },
      { recall: 0.5, precision: prec },
      { recall: 0.75, precision: Math.max(0.3, prec - 0.08) },
      { recall: 1.0, precision: Math.max(0.2, prec - 0.22) },
    ],
    calibration: [
      { predicted: 0.1, actual: 0.11 },
      { predicted: 0.3, actual: 0.28 },
      { predicted: 0.5, actual: 0.51 },
      { predicted: 0.7, actual: 0.69 },
      { predicted: 0.9, actual: 0.88 },
    ],
  };
}

/**
 * 1. CREATE MODEL DIALOG
 */
export function CreateModelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { addModel, datasets, currentUser } = useAppStore();
  const { toast } = useToast();

  const [algorithm, setAlgorithm] = React.useState<string>("XGBoost");
  const [customAlgorithm, setCustomAlgorithm] = React.useState("");
  const [version, setVersion] = React.useState("2.0");
  const [status, setStatus] = React.useState<ModelStatus>("Development");
  const [validationStrategy, setValidationStrategy] = React.useState("5-fold stratified cross-validation");
  const [datasetVersion, setDatasetVersion] = React.useState(datasets[0]?.name || "dataset_v1 (128 records)");
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>(AVAILABLE_FEATURES.slice(0, 8));
  
  // Metrics inputs
  const [rocAuc, setRocAuc] = React.useState("0.84");
  const [accuracy, setAccuracy] = React.useState("0.82");
  const [sensitivity, setSensitivity] = React.useState("0.79");
  const [specificity, setSpecificity] = React.useState("0.85");
  const [precision, setPrecision] = React.useState("0.78");
  const [f1, setF1] = React.useState("0.78");

  // Hyperparameters
  const [nEstimators, setNEstimators] = React.useState("300");
  const [maxDepth, setMaxDepth] = React.useState("6");
  const [learningRate, setLearningRate] = React.useState("0.05");

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAlgorithm = algorithm === "Custom" ? customAlgorithm.trim() || "Custom Architecture" : algorithm;
    const id = `model_${finalAlgorithm.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
    const parsedAuc = Math.min(1, Math.max(0.5, parseFloat(rocAuc) || 0.8));
    const parsedAcc = Math.min(1, Math.max(0.5, parseFloat(accuracy) || 0.8));
    const parsedSens = Math.min(1, Math.max(0.5, parseFloat(sensitivity) || 0.8));
    const parsedSpec = Math.min(1, Math.max(0.5, parseFloat(specificity) || 0.8));
    const parsedPrec = Math.min(1, Math.max(0.5, parseFloat(precision) || 0.8));
    const parsedF1 = Math.min(1, Math.max(0.5, parseFloat(f1) || 0.8));

    const newModel: ModelVersion = {
      id,
      algorithm: finalAlgorithm as ModelAlgorithm,
      version: version.trim() || "1.0",
      status,
      trainingDatasetVersion: datasetVersion,
      validationStrategy,
      featureList: selectedFeatures,
      hyperparameters: {
        n_estimators: parseInt(nEstimators, 10) || 200,
        max_depth: parseInt(maxDepth, 10) || 6,
        learning_rate: parseFloat(learningRate) || 0.05,
      },
      trainedAt: new Date().toISOString(),
      rocAuc: parsedAuc,
      metrics: buildSyntheticMetrics(parsedAuc, parsedAcc, parsedSens, parsedSpec, parsedPrec, parsedF1),
      fileLocation: `/models/${id}.joblib`,
    };

    addModel(newModel);
    toast({
      title: "Model Created & Registered",
      description: `Model ${finalAlgorithm} v${version} added to the registry by ${currentUser?.name}.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto scrollbar-medical">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" /> Create & Register New Model
          </DialogTitle>
          <DialogDescription className="text-xs">
            Add a machine learning or deep neural network model architecture to the research registry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-2">
          {/* Algorithm & Version */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Algorithm Architecture</Label>
              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XGBoost">XGBoost Gradient Booster</SelectItem>
                  <SelectItem value="Random Forest">Random Forest Classifier</SelectItem>
                  <SelectItem value="Logistic Regression">Logistic Regression (L2)</SelectItem>
                  <SelectItem value="Deep Neural Network">Deep Neural Network (3D CNN)</SelectItem>
                  <SelectItem value="LightGBM">LightGBM Fast Booster</SelectItem>
                  <SelectItem value="Gradient Boosting">Gradient Boosting Classifier</SelectItem>
                  <SelectItem value="Custom">Custom Algorithm Name…</SelectItem>
                </SelectContent>
              </Select>
              {algorithm === "Custom" && (
                <Input
                  placeholder="e.g. CatBoost Ensemble"
                  value={customAlgorithm}
                  onChange={(e) => setCustomAlgorithm(e.target.value)}
                  className="h-8 text-xs mt-1"
                  required
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Model Version</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 2.1"
                className="h-9 text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Status & Validation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Deployment Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ModelStatus)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Validated">Validated (Production)</SelectItem>
                  <SelectItem value="Development">Development / Candidate</SelectItem>
                  <SelectItem value="Not Available">Not Available (Deprecated)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Validation Strategy</Label>
              <Input
                value={validationStrategy}
                onChange={(e) => setValidationStrategy(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          {/* Training Dataset */}
          <div className="space-y-1.5">
            <Label className="text-xs">Training Dataset</Label>
            <Input
              value={datasetVersion}
              onChange={(e) => setDatasetVersion(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          {/* Features selected */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Features Included ({selectedFeatures.length})</Label>
              <button
                type="button"
                onClick={() =>
                  setSelectedFeatures(
                    selectedFeatures.length === AVAILABLE_FEATURES.length ? [] : [...AVAILABLE_FEATURES]
                  )
                }
                className="text-[10px] text-primary hover:underline"
              >
                {selectedFeatures.length === AVAILABLE_FEATURES.length ? "Clear All" : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto rounded-lg border border-border p-2 text-xs">
              {AVAILABLE_FEATURES.map((feat) => {
                const checked = selectedFeatures.includes(feat);
                return (
                  <label
                    key={feat}
                    className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-muted cursor-pointer text-[11px]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFeature(feat)}
                      className="rounded border-border text-primary"
                    />
                    <span className="truncate">{feat}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Performance Metrics (Validation / Calibration)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">ROC-AUC</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={rocAuc}
                  onChange={(e) => setRocAuc(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Accuracy</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={accuracy}
                  onChange={(e) => setAccuracy(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Sensitivity</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Specificity</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={specificity}
                  onChange={(e) => setSpecificity(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Precision</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={precision}
                  onChange={(e) => setPrecision(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">F1 Score</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={f1}
                  onChange={(e) => setF1(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Hyperparameters */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Hyperparameters
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">n_estimators</Label>
                <Input
                  value={nEstimators}
                  onChange={(e) => setNEstimators(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">max_depth</Label>
                <Input
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">learning_rate</Label>
                <Input
                  value={learningRate}
                  onChange={(e) => setLearningRate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-brand-gradient text-white">
              Create & Register Model
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 2. EDIT / UPDATE MODEL DIALOG
 */
export function EditModelDialog({
  model,
  open,
  onOpenChange,
}: {
  model: ModelVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateModel, currentUser } = useAppStore();
  const { toast } = useToast();

  const [version, setVersion] = React.useState("");
  const [status, setStatus] = React.useState<ModelStatus>("Validated");
  const [validationStrategy, setValidationStrategy] = React.useState("");
  const [datasetVersion, setDatasetVersion] = React.useState("");
  const [rocAuc, setRocAuc] = React.useState("0.85");
  const [accuracy, setAccuracy] = React.useState("0.82");
  const [sensitivity, setSensitivity] = React.useState("0.80");
  const [specificity, setSpecificity] = React.useState("0.84");

  React.useEffect(() => {
    if (model) {
      setVersion(model.version);
      setStatus(model.status);
      setValidationStrategy(model.validationStrategy || "");
      setDatasetVersion(model.trainingDatasetVersion || "");
      setRocAuc(String(model.rocAuc ?? 0.85));
      setAccuracy(String(model.metrics?.accuracy ?? 0.82));
      setSensitivity(String(model.metrics?.sensitivity ?? 0.80));
      setSpecificity(String(model.metrics?.specificity ?? 0.84));
    }
  }, [model]);

  if (!model) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAuc = Math.min(1, Math.max(0.5, parseFloat(rocAuc) || (model.rocAuc ?? 0.85)));
    const parsedAcc = Math.min(1, Math.max(0.5, parseFloat(accuracy) || 0.82));
    const parsedSens = Math.min(1, Math.max(0.5, parseFloat(sensitivity) || 0.8));
    const parsedSpec = Math.min(1, Math.max(0.5, parseFloat(specificity) || 0.84));
    const prevMetrics = model.metrics;

    updateModel(model.id, {
      version: version.trim() || model.version,
      status,
      validationStrategy: validationStrategy.trim() || model.validationStrategy,
      trainingDatasetVersion: datasetVersion.trim() || model.trainingDatasetVersion,
      rocAuc: parsedAuc,
      metrics: buildSyntheticMetrics(
        parsedAuc,
        parsedAcc,
        parsedSens,
        parsedSpec,
        prevMetrics?.precision ?? 0.78,
        prevMetrics?.f1 ?? 0.79
      ),
    });

    toast({
      title: "Model Updated",
      description: `${model.algorithm} v${version} configuration updated successfully.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4 text-primary" /> Edit Model: {model.algorithm}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Modify registry configuration, deployment tier, and performance calibrations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Model Version</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="h-9 text-xs font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Deployment Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ModelStatus)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Validated">Validated (Active)</SelectItem>
                  <SelectItem value="Development">Development (Candidate)</SelectItem>
                  <SelectItem value="Not Available">Not Available (Retired)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Validation Strategy</Label>
            <Input
              value={validationStrategy}
              onChange={(e) => setValidationStrategy(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Training Dataset</Label>
            <Input
              value={datasetVersion}
              onChange={(e) => setDatasetVersion(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Calibrated Performance Metrics
            </p>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">ROC-AUC</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={rocAuc}
                  onChange={(e) => setRocAuc(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Accuracy</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={accuracy}
                  onChange={(e) => setAccuracy(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Sensitivity</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Specificity</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={specificity}
                  onChange={(e) => setSpecificity(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-brand-gradient text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 3. VIEW / INSPECT MODEL DETAILS DIALOG (READ)
 */
export function ViewModelDetailsDialog({
  model,
  open,
  onOpenChange,
}: {
  model: ModelVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  if (!model) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(model, null, 2));
    setCopied(true);
    toast({ title: "Configuration Copied", description: "Model JSON specification copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto scrollbar-medical">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" /> {model.algorithm} v{model.version}
            </DialogTitle>
            <Badge
              variant="outline"
              className={
                model.status === "Validated"
                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                  : "border-amber-500/40 text-amber-600 bg-amber-500/10"
              }
            >
              {model.status}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Model ID: <span className="font-mono">{model.id}</span> · Trained: {model.trainedAt?.slice(0, 10) ?? "Untrained"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5 text-center">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">ROC-AUC</span>
              <p className="text-xl font-bold text-primary mt-0.5">{model.rocAuc?.toFixed(3) ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5 text-center">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Accuracy</span>
              <p className="text-xl font-bold text-foreground mt-0.5">
                {model.metrics ? `${(model.metrics.accuracy * 100).toFixed(1)}%` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5 text-center">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Sensitivity</span>
              <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                {model.metrics ? `${(model.metrics.sensitivity * 100).toFixed(1)}%` : "—"}
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-1.5 rounded-xl border border-border/70 p-3 bg-muted/20">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Validation Protocol:</span>
              <span className="font-medium text-foreground">{model.validationStrategy}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Training Dataset:</span>
              <span className="font-medium text-foreground">{model.trainingDatasetVersion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Artifact Path:</span>
              <span className="font-mono text-[11px] text-muted-foreground">{model.fileLocation}</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-1.5">
            <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
              Included Preoperative Features ({model.featureList.length})
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {model.featureList.map((f) => (
                <Badge key={f} variant="secondary" className="text-[10px] font-normal">
                  {f}
                </Badge>
              ))}
            </div>
          </div>

          {/* Hyperparameters */}
          {model.hyperparameters && Object.keys(model.hyperparameters).length > 0 && (
            <div className="space-y-1.5">
              <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                Tuned Hyperparameters
              </span>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                {Object.entries(model.hyperparameters).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border/80 bg-muted/40 p-2">
                    <span className="text-[10px] text-muted-foreground block truncate">{k}</span>
                    <strong className="text-foreground">{String(v)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center pt-2">
          <Button variant="outline" size="sm" onClick={copyJson} className="gap-1.5 text-xs">
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy JSON"}
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 4. DELETE MODEL ALERT DIALOG (DELETE)
 */
export function DeleteModelAlert({
  model,
  open,
  onOpenChange,
}: {
  model: ModelVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteModel, currentUser } = useAppStore();
  const { toast } = useToast();

  if (!model) return null;

  const handleDelete = () => {
    deleteModel(model.id);
    toast({
      title: "Model Deleted",
      description: `Model ${model.algorithm} v${model.version} was removed from the registry.`,
    });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" /> Delete Model from Registry?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-xs">
            <p>
              You are about to remove <strong className="font-semibold text-foreground">{model.algorithm} v{model.version}</strong> ({model.id}) from the active research registry.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This action will unregister the model from AI predictions, update synchronization across all devices, and log an audit trail entry under <strong className="text-foreground">{currentUser?.name}</strong>.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700 font-semibold">
            Delete Model
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
