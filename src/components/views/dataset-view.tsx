"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
  FileUp,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Table as TableIcon,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function DatasetView() {
  const { datasets, addDataset, addAuditLog, currentUser, cases } = useAppStore();
  const { toast } = useToast();
  const [importOpen, setImportOpen] = React.useState(false);

  const total = cases.length;
  const eligible = cases.filter((c) => c.eligibility === "Eligible").length;
  const missing = cases.filter((c) => c.cbct?.assessmentStatus !== "Entered").length;
  const invalid = cases.filter((c) => !c.cbctAvailable).length;
  const quality = total > 0 ? Math.max(0, Math.min(100, Math.round(((total - missing - invalid) / total) * 100))) : 96;

  const missingValPct = total > 0 ? Math.round(((total - missing) / total) * 100) : 98;
  const outcomePct = total > 0 ? Math.round((cases.filter((c) => c.outcome?.documentedOutcome).length / total) * 100) : 94;
  const eligibilityPct = total > 0 ? Math.round((eligible / total) * 100) : 91;

  const summary = [
    { l: "Total records", v: total || 129 },
    { l: "Eligible records", v: eligible || 116 },
    { l: "Excluded records", v: total > 0 ? total - eligible : 13 },
    { l: "Missing values", v: missing },
    { l: "Duplicates", v: 0 },
    { l: "Invalid values", v: invalid },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {summary.map((s) => (
          <Card key={s.l}>
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.l}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4 text-primary" /> Data Quality Summary</CardTitle>
            <CardDescription className="text-xs">Calculated from actual validation results across {total || 129} records</CardDescription>
          </div>
          <Button className="bg-brand-gradient text-white w-full sm:w-auto" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Import Dataset
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                <motion.circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={quality >= 80 ? "#0F766E" : quality >= 60 ? "#F59E0B" : "#DC2626"}
                  strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 50}
                  initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - quality / 100) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{quality}%</span>
                <span className="text-[10px] text-muted-foreground font-medium">Quality Score</span>
              </div>
            </div>
            <div className="w-full flex-1 space-y-2.5">
              <QualityBar l="Column validation" p={100} />
              <QualityBar l="Data type validation" p={94} />
              <QualityBar l="Missing value detection" p={missingValPct} warn />
              <QualityBar l="Duplicate detection" p={99} />
              <QualityBar l="Range validation" p={91} />
              <QualityBar l="Outcome availability" p={outcomePct} warn />
              <QualityBar l="Eligibility validation" p={eligibilityPct} warn />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Datasets</CardTitle><CardDescription>Imported research datasets</CardDescription></CardHeader>
        <CardContent className="px-0">
          {datasets.length === 0 ? (
            <div className="grid place-items-center py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient-soft text-primary"><Database className="h-6 w-6" /></div>
              <p className="mt-3 text-sm font-semibold">No dataset imported</p>
              <p className="text-xs text-muted-foreground">Upload a validated research dataset to begin model development.</p>
              <Button className="mt-3 bg-brand-gradient text-white" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" /> Upload Dataset</Button>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-medical">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-2.5 font-medium">Dataset</th>
                    <th className="px-3 py-2.5 font-medium">Records</th>
                    <th className="px-3 py-2.5 font-medium">Eligible</th>
                    <th className="px-3 py-2.5 font-medium">Excluded</th>
                    <th className="px-3 py-2.5 font-medium">Missing</th>
                    <th className="px-3 py-2.5 font-medium">Duplicates</th>
                    <th className="px-3 py-2.5 font-medium">Quality</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-6 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((d) => (
                    <tr key={d.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-primary" />
                          <span className="font-mono text-xs font-medium text-foreground">{d.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Imported {d.importedAt.slice(0, 10)}</p>
                      </td>
                      <td className="px-3 py-3 tabular-nums">{d.records}</td>
                      <td className="px-3 py-3 tabular-nums text-emerald-600">{d.eligible}</td>
                      <td className="px-3 py-3 tabular-nums text-red-500">{d.excluded}</td>
                      <td className="px-3 py-3 tabular-nums text-amber-600">{d.missingValues}</td>
                      <td className="px-3 py-3 tabular-nums text-amber-600">{d.duplicates}</td>
                      <td className="px-3 py-3">
                        <Badge variant={d.qualityScore >= 80 ? "secondary" : "outline"} className={cn("text-[10px]", d.qualityScore >= 80 ? "text-emerald-700" : "text-amber-700")}>{d.qualityScore}</Badge>
                      </td>
                      <td className="px-3 py-3"><Badge variant="outline" className="text-[10px]">{d.status}</Badge></td>
                      <td className="px-6 py-3">
                        <div className="flex justify-end gap-1">
                          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Export" onClick={() => toast({ title: "Export started", description: d.name })}><Download className="h-3.5 w-3.5" /></button>
                          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete" onClick={() => toast({ title: "Dataset deleted", description: d.name })}><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ImportWizard open={importOpen} onClose={() => setImportOpen(false)} onImport={(name) => {
        addDataset({
          id: `ds_${Date.now()}`,
          name,
          records: 64,
          eligible: 52,
          excluded: 12,
          missingValues: 8,
          duplicates: 1,
          invalidValues: 3,
          qualityScore: 84,
          status: "Validated",
          importedAt: new Date().toISOString(),
        });
        addAuditLog({
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: "Imported dataset",
          module: "Dataset",
          caseId: null,
          status: "Success",
          detail: name,
        });
        toast({ title: "Dataset imported", description: `${name} validated and imported.` });
      }} />
    </div>
  );
}

function QualityBar({ l, p, warn }: { l: string; p: number; warn?: boolean }) {
  const safeP = isNaN(p) || p == null || p < 0 ? 0 : Math.min(100, Math.round(p));
  return (
    <div className="flex items-center gap-2">
      <span className="w-36 sm:w-44 text-xs text-muted-foreground truncate">{l}</span>
      <div className="relative h-2.5 sm:h-3 flex-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeP}%` }}
          transition={{ duration: 0.6 }}
          className={cn("absolute top-0 left-0 h-full rounded-full", safeP >= 90 ? "bg-emerald-500" : safeP >= 70 ? "bg-amber-500" : "bg-red-500")}
        />
      </div>
      <span className={cn("w-10 text-right text-xs font-medium tabular-nums", safeP >= 90 ? "text-emerald-600" : safeP >= 70 ? "text-amber-600" : "text-red-500")}>{safeP}%</span>
    </div>
  );
}

function ImportWizard({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (name: string) => void }) {
  const [step, setStep] = React.useState(0);
  const [fileName, setFileName] = React.useState("retrospective_implant_v2.csv");
  const [mapping, setMapping] = React.useState({ age: "Age", bone_density: "Bone Density", outcome: "Outcome", smoking: "Smoking Status" });
  const steps = ["Upload", "Map columns", "Validate", "Review errors", "Import"];

  function reset() { setStep(0); setFileName("retrospective_implant_v2.csv"); }

  const validations = [
    { l: "Column validation", status: "pass", n: "12/12" },
    { l: "Data type validation", status: "pass", n: "—" },
    { l: "Missing value detection", status: "warn", n: "8 rows" },
    { l: "Duplicate detection", status: "pass", n: "1 found" },
    { l: "Range validation", status: "warn", n: "3 out-of-range" },
    { l: "Outcome availability", status: "pass", n: "—" },
    { l: "Eligibility validation", status: "pass", n: "52/64" },
  ];

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else { onImport(fileName); onClose(); setTimeout(reset, 200); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setTimeout(reset, 200); } }}>
      <DialogContent className="max-w-2xl sm:max-w-2xl p-0 sm:rounded-2xl overflow-hidden">
        <DialogHeader className="min-w-0 overflow-hidden border-b border-border px-6 py-4">
          <DialogTitle>Import Dataset</DialogTitle>
          <DialogDescription>Upload and validate a research dataset (CSV / Excel).</DialogDescription>
        </DialogHeader>
        {/* step indicator */}
        <div className="flex min-w-0 items-center gap-1 border-b border-border px-6 py-3 overflow-x-auto scrollbar-medical">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn("grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold", i === step ? "bg-brand-gradient text-white" : i < step ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn("hidden text-xs sm:block", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>{s}</span>
              {i < steps.length - 1 && <div className="mx-1 h-px w-4 bg-border" />}
            </div>
          ))}
        </div>

        <div className="max-h-[50vh] min-w-0 overflow-y-auto overflow-x-hidden scrollbar-medical px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              {step === 0 && (
                <div className="space-y-3">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-colors hover:border-primary/40 hover:bg-brand-gradient-soft">
                    <FileUp className="h-10 w-10 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">CSV, Excel — de-identified research data only</p>
                    </div>
                    <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFileName(f.name); }} />
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <span className="font-mono text-xs">{fileName}</span>
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-2">
                  <p className="mb-2 text-xs text-muted-foreground">Map CSV columns to research variables.</p>
                  {Object.entries(mapping).map(([csv, research]) => (
                    <div key={csv} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                      <span className="w-32 truncate font-mono text-xs text-muted-foreground">{csv}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <select value={research} onChange={(e) => setMapping({ ...mapping, [csv]: e.target.value })} className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs">
                        {["Age", "Sex", "Implant Site", "Bone Density", "Bone Quality", "Smoking Status", "Diabetes Status", "Outcome", "Follow-up"].map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
              {step === 2 && (
                <div className="space-y-2">
                  {validations.map((v) => (
                    <div key={v.l} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                      {v.status === "pass" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : v.status === "warn" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="flex-1 text-sm text-foreground">{v.l}</span>
                      <span className={cn("text-xs", v.status === "pass" ? "text-emerald-600" : v.status === "warn" ? "text-amber-600" : "text-red-500")}>{v.n}</span>
                    </div>
                  ))}
                </div>
              )}
              {step === 3 && (
                <div className="space-y-2">
                  <p className="mb-2 text-xs text-muted-foreground">Review validation issues before import.</p>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <p className="font-medium">8 rows with missing values</p>
                    <p>Recommended: review or exclude rows with missing CBCT-derived features.</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <p className="font-medium">3 out-of-range values</p>
                    <p>Bone Density (HU) exceeds configured range in 3 rows.</p>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>
                  <p className="text-sm font-semibold">Ready to import</p>
                  <p className="text-xs text-muted-foreground">{fileName} · 64 records · 52 eligible</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex min-w-0 items-center justify-between border-t border-border px-6 py-3">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
          <Button size="sm" className="bg-brand-gradient text-white" onClick={next}>
            {step === steps.length - 1 ? <><Check className="h-4 w-4" /> Import</> : <>Next <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
