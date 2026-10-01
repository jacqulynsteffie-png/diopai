"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ScanLine,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Move,
  Activity,
  Bone,
  Image as ImageIcon,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RESEARCH_PROTOCOL_TBD } from "@/lib/types";

export function CbctView() {
  const { cases, selectedCaseId, setSelectedCase } = useAppStore();
  const caseData = cases.find((c) => c.id === selectedCaseId) ?? cases[0];
  const [zoom, setZoom] = React.useState(1);
  const [rotate, setRotate] = React.useState(0);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const cbct = caseData?.cbct;
  const [uploaded, setUploaded] = React.useState<string | null>(null);

  if (!caseData) {
    return <Empty title="No research case" desc="Select a case to view CBCT features." />;
  }

  return (
    <div className="space-y-4">
      {/* Case selector */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Research Case</p>
            <p className="font-mono text-sm font-semibold text-primary">{caseData.caseId}</p>
            <p className="text-xs text-muted-foreground">{caseData.age}y · {caseData.sex} · {caseData.implantSite}</p>
          </div>
          <div className="flex items-center gap-2">
            <SelectCase value={caseData.id} onChange={setSelectedCase} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Viewer */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between border-b border-border">
            <div>
              <CardTitle className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-primary" /> CBCT Visualization</CardTitle>
              <CardDescription>CBCT-derived feature entry (manual review)</CardDescription>
            </div>
            <Badge variant={caseData.cbctAvailable ? "secondary" : "outline"}>{caseData.cbctAvailable ? caseData.cbctQuality : "No CBCT"}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative grid h-[420px] place-items-center overflow-hidden bg-[#0B1220]">
              {/* grid background */}
              <div className="absolute inset-0 bg-grid-dark opacity-50" />
              {/* radial scan glow */}
              <motion.div
                className="absolute h-72 w-72 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(6,182,212,0.25), transparent 70%)" }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              {uploaded ? (
                <motion.img
                  src={uploaded}
                  alt="Uploaded CBCT preview"
                  className="max-h-[360px] rounded-lg border border-white/10 shadow-2xl"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotate}deg)` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              ) : (
                <div
                  className="relative grid h-64 w-64 place-items-center rounded-2xl border border-white/10 bg-white/5"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotate}deg)` }}
                >
                  {/* synthetic CBCT placeholder */}
                  <div className="absolute inset-3 rounded-xl bg-gradient-to-br from-slate-700/40 to-slate-900/60" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <ScanLine className="mx-auto h-12 w-12 text-cyan-300/70" />
                      <p className="mt-2 text-xs text-slate-300">CBCT preview placeholder</p>
                      <p className="text-[10px] text-slate-500">Synthetic anatomical grid</p>
                    </div>
                  </div>
                </div>
              )}
              {/* crosshair */}
              <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-400/20" />
              <div className="pointer-events-none absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-cyan-400/20" />
            </div>
            {/* viewer controls */}
            <div className="flex flex-wrap items-center gap-1 border-t border-border p-2">
              <CtrlBtn onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}><ZoomOut className="h-4 w-4" /></CtrlBtn>
              <span className="px-2 text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
              <CtrlBtn onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}><ZoomIn className="h-4 w-4" /></CtrlBtn>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <CtrlBtn onClick={() => setRotate((r) => r - 90)}><RotateCw className="h-4 w-4 rotate-180" /></CtrlBtn>
              <CtrlBtn onClick={() => setRotate((r) => r + 90)}><RotateCw className="h-4 w-4" /></CtrlBtn>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <CtrlBtn onClick={() => { setZoom(1); setRotate(0); setPan({ x: 0, y: 0 }); }}><Move className="h-4 w-4" /></CtrlBtn>
              <CtrlBtn onClick={() => {}}><Maximize2 className="h-4 w-4" /></CtrlBtn>
              <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-medium text-white">
                <Upload className="h-3.5 w-3.5" /> Upload CBCT
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploaded(URL.createObjectURL(f));
                  }}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Feature panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Image Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Stat l="Quality" v={caseData.cbctQuality} />
              <Stat l="Image Quality Score" v={`${cbct?.imageQualityScore ?? "—"} / 5`} />
              <Stat l="Source" v={cbct?.source ?? "—"} />
              <Stat l="Assessment Status" v={cbct?.assessmentStatus ?? "—"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bone className="h-4 w-4 text-primary" /> Bone Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Stat l="Bone Density" v={`${cbct?.boneDensityHu ?? "—"} HU`} />
              <Stat l="Bone Quality" v={cbct?.boneQuality ?? "—"} />
              <Stat l="Buccolingual Width" v={`${cbct?.buccolingualWidth ?? "—"} mm`} />
              <Stat l="Apicocoronal Height" v={`${cbct?.apicocoronalHeight ?? "—"} mm`} />
              <Stat l="Cortical Thickness" v={`${cbct?.corticalBoneThickness ?? "—"} mm`} />
              <Stat l="Buccal Plate" v={`${cbct?.buccalPlateThickness ?? "—"} mm`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Anatomical Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Stat l="Sinus Floor → Crest" v={cbct?.sinusFloorToCrest != null ? `${cbct.sinusFloorToCrest} mm` : "N/A (mandible)"} />
              <Stat l="Distance to I.A." v={cbct?.distanceToIA != null ? `${cbct.distanceToIA} mm` : "N/A (maxilla)"} />
              <Stat l="Interradicular Bone" v={cbct?.interradicularBone != null ? `${cbct.interradicularBone} mm` : "N/A"} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        <Info className="h-3.5 w-3.5 mt-0.5" />
        <span>
          This viewer supports image upload, preview, zoom, pan, rotate, and fullscreen. Automated segmentation is <strong>not</strong> implemented — feature entry is manual. {RESEARCH_PROTOCOL_TBD} for protocol-specific CBCT measurement thresholds.
        </span>
      </div>
    </div>
  );
}

function CtrlBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );
}

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1 text-xs last:border-0">
      <span className="text-muted-foreground">{l}</span>
      <span className="font-medium text-foreground">{v}</span>
    </div>
  );
}

function SelectCase({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { cases } = useAppStore();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground"
    >
      {cases.slice(0, 50).map((c) => (
        <option key={c.id} value={c.id}>{c.caseId} — {c.age}y {c.implantSite}</option>
      ))}
    </select>
  );
}

function Empty({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="grid place-items-center py-20 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient-soft text-primary">
        <ScanLine className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
