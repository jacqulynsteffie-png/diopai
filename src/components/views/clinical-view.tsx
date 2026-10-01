"use client";

import * as React from "react";
import { Activity, Stethoscope } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ClinicalView() {
  const { cases, selectedCaseId, setSelectedCase } = useAppStore();
  const caseData = cases.find((c) => c.id === selectedCaseId) ?? cases[0];
  if (!caseData) return null;
  const cl = caseData.clinical;

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" /> General Clinical Information</CardTitle><CardDescription>Approved research variables</CardDescription></CardHeader>
          <CardContent className="space-y-1.5">
            <Row l="Smoking Status" v={cl.smokingStatus} />
            <Row l="Diabetes Status" v={cl.diabetesStatus} />
            <Row l="Bruxism" v={cl.bruxism == null ? "—" : cl.bruxism ? "Yes" : "No"} />
            <Row l="Periodontitis History" v={cl.additionalVariables[0]?.value ?? "—"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Implant-Related Variables</CardTitle><CardDescription>Configurable research variables</CardDescription></CardHeader>
          <CardContent className="space-y-1.5">
            <Row l="Implant System" v={cl.implantSystem} />
            <Row l="Diameter" v={cl.implantDiameterMm != null ? `${cl.implantDiameterMm} mm` : "—"} />
            <Row l="Length" v={cl.implantLengthMm != null ? `${cl.implantLengthMm} mm` : "—"} />
            <Row l="Loading Protocol" v={cl.loadingProtocol} />
            <Row l="Prosthetic Type" v={cl.prostheticType} />
            <Row l="Augmentation Performed" v={cl.augmentationPerformed == null ? "—" : cl.augmentationPerformed ? "Yes" : "No"} />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs font-medium text-muted-foreground">Other approved research variables</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Periodontitis History", "Implant Brand", "Bone Graft Type", "Surgical Approach"].map((v) => (
            <Badge key={v} variant="secondary" className="text-[11px]">{v}</Badge>
          ))}
          <Badge variant="outline" className="text-[11px] text-muted-foreground">+ configurable</Badge>
        </div>
      </div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{l}</span>
      <span className="font-medium text-foreground">{v}</span>
    </div>
  );
}
