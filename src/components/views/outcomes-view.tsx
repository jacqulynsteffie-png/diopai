"use client";

import * as React from "react";
import { Target, Calendar, ClipboardList, Info } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STUDY_META } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OutcomesView() {
  const { cases, selectedCaseId, setSelectedCase } = useAppStore();
  const caseData = cases.find((c) => c.id === selectedCaseId) ?? cases[0];
  if (!caseData) return null;
  const o = caseData.outcome;

  // stats
  const total = cases.length;
  const withOutcome = cases.filter((c) => c.outcome?.documentedOutcome).length;
  const success = cases.filter((c) => c.outcome?.documentedOutcome === "Success").length;
  const failure = cases.filter((c) => c.outcome?.documentedOutcome === "Failure").length;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-muted-foreground">Research Case</p>
            <p className="font-mono text-sm font-semibold text-primary">{caseData.caseId}</p>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Cases" value={total} icon={ClipboardList} />
        <StatCard label="With Documented Outcome" value={withOutcome} icon={Target} accent="text-blue-600" />
        <StatCard label="Success" value={success} icon={Target} accent="text-emerald-600" />
        <StatCard label="Failure" value={failure} icon={Target} accent="text-red-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Outcome Record</CardTitle>
          <CardDescription>{caseData.caseId}</CardDescription>
        </CardHeader>
        <CardContent>
          {o ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Row l="Documented Outcome" v={o.documentedOutcome ?? "—"} highlight={o.documentedOutcome} />
              <Row l="Follow-up Duration" v={o.followUpMonths != null ? `${o.followUpMonths} months` : "—"} />
              <Row l="Assessment Date" v={o.assessmentDate?.slice(0, 10) ?? "—"} icon={Calendar} />
              <Row l="Classification Source" v={o.classificationSource} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-medium text-foreground">No documented outcome yet</p>
              <p className="text-xs text-muted-foreground">Outcomes are recorded after follow-up per research protocol.</p>
            </div>
          )}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            <Info className="h-3.5 w-3.5 mt-0.5" />
            <span>{STUDY_META.disclaimer} Outcome definition is configurable and must come from the research protocol.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Icon className={cn("h-5 w-5", accent ?? "text-muted-foreground")} />
        </div>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function Row({ l, v, highlight, icon: Icon }: { l: string; v: string; highlight?: string | null; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</p>
      {highlight ? (
        <Badge variant="outline" className={cn("mt-1", highlight === "Success" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-600")}>
          {v}
        </Badge>
      ) : (
        <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          {v}
        </p>
      )}
    </div>
  );
}
