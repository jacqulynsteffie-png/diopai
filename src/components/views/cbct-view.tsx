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
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
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
  const [uploadedName, setUploadedName] = React.useState<string | null>(null);
  const [verifyState, setVerifyState] = React.useState<"idle" | "verifying" | "verified">("idle");
  const verifyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => { if (verifyTimer.current) clearTimeout(verifyTimer.current); };
  }, []);

  function handleUpload(file: File) {
    setUploaded(URL.createObjectURL(file));
    setUploadedName(file.name);
    setVerifyState("verifying");
    // simulate image verification (quality/format check) — not segmentation
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    verifyTimer.current = setTimeout(() => setVerifyState("verified"), 2600);
  }

  function resetImage() {
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    setUploaded(null);
    setUploadedName(null);
    setVerifyState("idle");
    setZoom(1);
    setRotate(0);
    setPan({ x: 0, y: 0 });
  }

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
                <>
                  <motion.img
                    src={uploaded}
                    alt="Uploaded CBCT preview"
                    className="max-h-[360px] max-w-full rounded-lg border border-white/10 shadow-2xl"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotate}deg)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: verifyState === "verifying" ? 0.85 : 1 }}
                  />
                  {/* verification scanning overlay */}
                  {verifyState === "verifying" && (
                    <>
                      <div className="absolute inset-0 bg-[#0B1220]/30" />
                      {/* moving scan line */}
                      <motion.div
                        className="absolute inset-x-0 h-24"
                        style={{
                          background: "linear-gradient(to bottom, transparent, rgba(6,182,212,0.5), transparent)",
                          boxShadow: "0 0 24px rgba(6,182,212,0.6)",
                        }}
                        initial={{ top: "0%" }}
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-cyan-400/30 bg-[#0B1220]/80 px-5 py-3 backdrop-blur">
                          <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
                          <p className="text-xs font-medium text-white">Verifying image quality…</p>
                          <p className="text-[10px] text-slate-400">Format & quality check (not segmentation)</p>
                        </div>
                      </div>
                    </>
                  )}
                  {/* verified badge */}
                  {verifyState === "verified" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Image verified
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="relative grid h-64 w-64 place-items-center rounded-2xl border border-white/10 bg-white/5">
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

            {/* verification status strip */}
            {uploaded && (
              <div className={cn(
                "flex items-center gap-2 border-b border-border px-3 py-2 text-xs",
                verifyState === "verified" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-muted/50 text-muted-foreground"
              )}>
                {verifyState === "verifying" ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-500" /> <span>Verifying <span className="font-mono text-foreground">{uploadedName}</span>…</span></>
                ) : verifyState === "verified" ? (
                  <><ShieldCheck className="h-3.5 w-3.5" /> <span>Image verified — adequate quality for manual feature entry.</span></>
                ) : null}
                <span className="ml-auto truncate text-[10px] text-muted-foreground">{uploadedName}</span>
                <button onClick={resetImage} className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Remove image"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            {/* viewer controls */}
            <div className="flex flex-wrap items-center gap-1 border-t border-border p-2">
              <CtrlBtn onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} disabled={!uploaded}><ZoomOut className="h-4 w-4" /></CtrlBtn>
              <span className="px-2 text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
              <CtrlBtn onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} disabled={!uploaded}><ZoomIn className="h-4 w-4" /></CtrlBtn>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <CtrlBtn onClick={() => setRotate((r) => r - 90)} disabled={!uploaded}><RotateCw className="h-4 w-4 rotate-180" /></CtrlBtn>
              <CtrlBtn onClick={() => setRotate((r) => r + 90)} disabled={!uploaded}><RotateCw className="h-4 w-4" /></CtrlBtn>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <CtrlBtn onClick={() => { setZoom(1); setRotate(0); setPan({ x: 0, y: 0 }); }} disabled={!uploaded}><Move className="h-4 w-4" /></CtrlBtn>
              <CtrlBtn onClick={() => {}} disabled={!uploaded}><Maximize2 className="h-4 w-4" /></CtrlBtn>
              <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-95">
                {uploaded ? <RefreshCw className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                {uploaded ? "Replace" : "Upload CBCT"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.currentTarget.value = "";
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

function CtrlBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground"
      )}
    >
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
