"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Activity, GitCompare, Cpu, Info } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
  Legend,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";

export function ModelPerformanceView() {
  const { models } = useAppStore();
  const active = models.find((m) => m.algorithm === "XGBoost") ?? models[0];
  const metrics = active?.metrics;

  const metricCards = metrics
    ? [
        { l: "Accuracy", v: metrics.accuracy, color: "from-blue-500 to-cyan-500" },
        { l: "Sensitivity", v: metrics.sensitivity, color: "from-teal-500 to-emerald-500" },
        { l: "Specificity", v: metrics.specificity, color: "from-cyan-500 to-blue-500" },
        { l: "Precision", v: metrics.precision, color: "from-violet-500 to-fuchsia-500" },
        { l: "F1 Score", v: metrics.f1, color: "from-blue-500 to-indigo-500" },
        { l: "ROC-AUC", v: metrics.rocAuc, color: "from-cyan-500 to-teal-500" },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Performance cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metricCards.map((m, i) => (
          <motion.div key={m.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="relative overflow-hidden">
              <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", m.color)} />
              <CardContent className="p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{m.l}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{(m.v * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto bg-muted/60 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="confusion">Confusion Matrix</TabsTrigger>
          <TabsTrigger value="roc">ROC Curve</TabsTrigger>
          <TabsTrigger value="pr">Precision-Recall</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
          <TabsTrigger value="features">Feature Importance</TabsTrigger>
          <TabsTrigger value="cv">Cross Validation</TabsTrigger>
          <TabsTrigger value="compare">Model Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Model Overview</CardTitle><CardDescription>{active?.algorithm} v{active?.version}</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Meta l="Algorithm" v={active?.algorithm} />
              <Meta l="Version" v={active?.version} />
              <Meta l="Status" v={active?.status} />
              <Meta l="Training Dataset" v={active?.trainingDatasetVersion} />
              <Meta l="Last Trained" v={active?.trainedAt?.slice(0, 10) ?? "—"} />
              <Meta l="Features" v={active?.featureList.length} />
              <Meta l="ROC-AUC" v={active?.rocAuc} />
              <Meta l="Validation" v={active?.validationStrategy} />
              <Meta l="Model File" v={active?.fileLocation} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confusion">
          {metrics && <ConfusionMatrix cm={metrics.confusionMatrix} />}
        </TabsContent>

        <TabsContent value="roc">
          {metrics && <RocCard data={metrics.rocCurve} auc={metrics.rocAuc} />}
        </TabsContent>

        <TabsContent value="pr">
          {metrics && (
            <Card>
              <CardHeader><CardTitle>Precision–Recall Curve</CardTitle><CardDescription>Precision vs recall trade-off</CardDescription></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.prCurve} margin={{ left: -16, right: 8, top: 10 }}>
                      <defs><linearGradient id="pr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0F766E" stopOpacity={0.4} /><stop offset="100%" stopColor="#0F766E" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="recall" name="Recall" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 1]} />
                      <YAxis dataKey="precision" name="Precision" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 1]} />
                      <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
                      <Area type="monotone" dataKey="precision" stroke="#0F766E" strokeWidth={2.5} fill="url(#pr)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calibration">
          {metrics && (
            <Card>
              <CardHeader><CardTitle>Calibration Curve</CardTitle><CardDescription>Predicted vs actual probability</CardDescription></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.calibration} margin={{ left: -16, right: 8, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="predicted" name="Predicted" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 1]} />
                      <YAxis name="Actual" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 1]} />
                      <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
                      <Line type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: "#2563EB" }} />
                      <Line type="linear" dataKey={() => 0} stroke="#94A3B8" strokeDasharray="4 3" dot={false} name="Ideal" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features">
          {active && <FeatureImportance modelId={active.id} />}
        </TabsContent>

        <TabsContent value="cv">
          <Card>
            <CardHeader><CardTitle>Cross-Validation</CardTitle><CardDescription>{active?.validationStrategy}</CardDescription></CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">Per-fold performance (synthetic demo). Stratified k-fold applied per research protocol.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[1,2,3,4,5].map((fold) => ({ fold: `Fold ${fold}`, auc: +(0.78 + (Math.random() * 0.08)).toFixed(3) }))} margin={{ left: -16, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="fold" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0.7, 0.9]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
                    <Bar dataKey="auc" radius={[6, 6, 0, 0]} fill="#2563EB" barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare">
          <ModelComparison />
        </TabsContent>
      </Tabs>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        <Info className="h-3.5 w-3.5 mt-0.5" />
        <span>All metrics are synthetic demo values, not validated clinical performance. No model is labeled "best" without an explicitly defined selection criterion in the research protocol.</span>
      </div>
    </div>
  );
}

function ConfusionMatrix({ cm }: { cm: { tp: number; fp: number; fn: number; tn: number } }) {
  const cells = [
    { l: "True Positive", v: cm.tp, color: "bg-emerald-500", text: "text-white", sub: "Predicted Success · Actual Success" },
    { l: "False Positive", v: cm.fp, color: "bg-amber-500", text: "text-white", sub: "Predicted Success · Actual Failure" },
    { l: "False Negative", v: cm.fn, color: "bg-orange-500", text: "text-white", sub: "Predicted Failure · Actual Success" },
    { l: "True Negative", v: cm.tn, color: "bg-teal-500", text: "text-white", sub: "Predicted Failure · Actual Failure" },
  ];
  return (
    <Card>
      <CardHeader><CardTitle>Confusion Matrix</CardTitle><CardDescription>2×2 prediction vs actual</CardDescription></CardHeader>
      <CardContent>
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex justify-end pl-24 pr-2 text-[11px] font-medium text-muted-foreground">Actual</div>
          <div className="flex">
            <div className="flex w-24 flex-col justify-center items-center pr-2 text-[11px] font-medium text-muted-foreground">
              <span className="-rotate-90 whitespace-nowrap">Predicted</span>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-1.5">
              {cells.map((c) => (
                <div key={c.l} className={cn("rounded-xl p-4 text-center", c.color)}>
                  <p className={cn("text-[10px] uppercase tracking-wide", c.text)}>{c.l}</p>
                  <p className={cn("text-3xl font-bold", c.text)}>{c.v}</p>
                  <p className={cn("text-[10px] opacity-80", c.text)}>{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Correct</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-amber-500" /> FP</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-orange-500" /> FN</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RocCard({ data, auc }: { data: { fpr: number; tpr: number }[]; auc: number }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>ROC Curve</CardTitle>
          <CardDescription>Sensitivity vs (1 − Specificity)</CardDescription>
        </div>
        <Badge className="bg-brand-gradient text-white">AUC = {auc.toFixed(2)}</Badge>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -16, right: 8, top: 10 }}>
              <defs><linearGradient id="roc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="fpr" name="1 − Specificity" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 1]} />
              <YAxis name="Sensitivity" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 1]} />
              <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
              <Area type="monotone" dataKey="tpr" stroke="#2563EB" strokeWidth={2.5} fill="url(#roc)" />
              <Line type="linear" data={data} dataKey={() => 0} stroke="#94A3B8" strokeDasharray="4 3" dot={false} name="Random" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureImportance({ modelId }: { modelId: string }) {
  const { models } = useAppStore();
  const m = models.find((x) => x.id === modelId);
  if (!m) return null;
  // synthetic importance derived from feature list
  const data = m.featureList.map((f, i) => ({ name: f, value: +(0.3 - i * 0.025 + Math.random() * 0.05).toFixed(3) }));
  return (
    <Card>
      <CardHeader><CardTitle>Feature Importance</CardTitle><CardDescription>Model reliance on each variable (not causation)</CardDescription></CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={140} />
              <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                {data.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#2563EB" : "#06B6D4"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ModelComparison() {
  const { models } = useAppStore();
  const rows = models.map((m) => ({
    algorithm: m.algorithm,
    version: m.version,
    status: m.status,
    accuracy: m.metrics?.accuracy ?? 0,
    sensitivity: m.metrics?.sensitivity ?? 0,
    specificity: m.metrics?.specificity ?? 0,
    f1: m.metrics?.f1 ?? 0,
    rocAuc: m.rocAuc ?? 0,
    active: m.algorithm === "XGBoost",
  }));
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><GitCompare className="h-4 w-4 text-primary" /> Model Comparison</CardTitle><CardDescription>Logistic Regression · Random Forest · XGBoost</CardDescription></CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto scrollbar-medical">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-2.5 font-medium">Algorithm</th>
                <th className="px-3 py-2.5 font-medium">Version</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Accuracy</th>
                <th className="px-3 py-2.5 font-medium">Sensitivity</th>
                <th className="px-3 py-2.5 font-medium">Specificity</th>
                <th className="px-3 py-2.5 font-medium">F1</th>
                <th className="px-6 py-2.5 font-medium text-right">ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.algorithm} className={cn("border-b border-border/60", r.active && "bg-brand-gradient-soft")}>
                  <td className="px-6 py-3 font-medium text-foreground flex items-center gap-1.5">
                    {r.active && <Cpu className="h-3.5 w-3.5 text-primary" />} {r.algorithm}
                    {r.active && <Badge className="ml-1 bg-primary/10 text-primary text-[9px]">Current</Badge>}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{r.version}</td>
                  <td className="px-3 py-3"><Badge variant="outline" className="text-[10px]">{r.status}</Badge></td>
                  <td className="px-3 py-3 tabular-nums">{(r.accuracy * 100).toFixed(1)}%</td>
                  <td className="px-3 py-3 tabular-nums">{(r.sensitivity * 100).toFixed(1)}%</td>
                  <td className="px-3 py-3 tabular-nums">{(r.specificity * 100).toFixed(1)}%</td>
                  <td className="px-3 py-3 tabular-nums">{(r.f1 * 100).toFixed(1)}%</td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold text-primary">{r.rocAuc.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{l}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground break-words">{v}</p>
    </div>
  );
}
