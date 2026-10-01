"use client";

import * as React from "react";
import { BarChart3, Info, ScatterChart as ScatterIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
  Legend,
} from "recharts";
import { useAppStore } from "@/lib/store";

export function FeatureAnalysisView() {
  const { cases } = useAppStore();

  const importance = [
    { feature: "Bone Density (HU)", value: 0.31, dir: "+" },
    { feature: "Bone Quality", value: 0.24, dir: "+" },
    { feature: "Cortical Thickness", value: 0.19, dir: "+" },
    { feature: "Smoking Status", value: 0.17, dir: "-" },
    { feature: "Diabetes Status", value: 0.13, dir: "-" },
    { feature: "Implant Length", value: 0.1, dir: "+" },
    { feature: "Loading Protocol", value: 0.07, dir: "-" },
    { feature: "Buccolingual Width", value: 0.06, dir: "+" },
  ];

  // SHAP-like scatter (synthetic) per feature vs prediction probability
  const shapScatter = cases.slice(0, 80).map((c) => ({
    density: c.cbct.boneDensityHu ?? 0,
    prob: c.prediction?.probability ?? 0.5,
    outcome: c.outcome?.documentedOutcome ?? "Unknown",
  }));

  // distribution of bone density by outcome
  const distBuckets = (() => {
    const ranges = [["300-500", 300, 500], ["500-700", 500, 700], ["700-900", 700, 900], ["900-1100", 900, 1100]];
    return ranges.map(([label, lo, hi]) => {
      const succ = cases.filter((c) => c.cbct.boneDensityHu >= lo && c.cbct.boneDensityHu < hi && c.outcome?.documentedOutcome === "Success").length;
      const fail = cases.filter((c) => c.cbct.boneDensityHu >= lo && c.cbct.boneDensityHu < hi && c.outcome?.documentedOutcome === "Failure").length;
      return { range: label, Success: succ, Failure: fail };
    });
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-brand-gradient-soft px-3 py-2 text-[11px] text-primary">
        <Info className="h-3.5 w-3.5 mt-0.5" />
        <span>Feature importance indicates how much the model relied on this variable in generating predictions. It does not establish causality.</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Feature Importance</CardTitle><CardDescription>Global model reliance</CardDescription></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={importance} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={140} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {importance.map((d, i) => (
                      <Cell key={i} fill={d.dir === "+" ? "#2563EB" : "#DC2626"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-600" /> Increases Success</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-600" /> Decreases Success</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ScatterIcon className="h-4 w-4 text-primary" /> SHAP Summary</CardTitle><CardDescription>Bone Density vs predicted probability</CardDescription></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: -16, right: 8, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" dataKey="density" name="Bone Density (HU)" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="prob" name="Probability" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 1]} />
                  <ZAxis range={[60, 60]} />
                  <RTooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
                  <Scatter name="Cases" data={shapScatter} fill="#06B6D4" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Bone Density Distribution by Outcome</CardTitle><CardDescription>Research-use distribution analysis</CardDescription></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distBuckets} margin={{ left: -16, right: 8, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Success" stackId="a" fill="#0F766E" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Failure" stackId="a" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
