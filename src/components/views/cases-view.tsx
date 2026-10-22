"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  Pencil,
  Brain,
  FileText,
  X,
  ClipboardCheck,
  ScanLine,
  Activity,
  RefreshCw,
  Trash2,
  Lock,
  CheckSquare,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { STUDY_META, type ResearchCase } from "@/lib/types";

type SortKey = "createdAt" | "age" | "caseId" | "prediction";

export function CasesView() {
  const { cases, openNewCase, setSelectedCase, selectedCaseId, setView, hydrateFromDb, syncToCloud, currentUser, deleteCase, deleteCases } = useAppStore();
  const isAdmin = currentUser?.role === "Admin";
  const [caseToDelete, setCaseToDelete] = React.useState<ResearchCase | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [fOutcome, setFOutcome] = React.useState("all");
  const [fCbct, setFCbct] = React.useState("all");
  const [fEligibility, setFEligibility] = React.useState("all");
  const [fPred, setFPred] = React.useState("all");
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    hydrateFromDb();
  }, [hydrateFromDb]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await hydrateFromDb();
      const currentCount = useAppStore.getState().cases.length;
      toast({
        title: "Research Cases Synchronized",
        description: `Current research database has ${currentCount} records (synchronized with Supabase Cloud).`,
      });
    } catch {
      toast({
        title: "Sync Refreshed",
        description: `Cases refreshed.`,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = React.useMemo(() => {
    let r = [...cases];
    if (query) r = r.filter((c) => c.caseId.toLowerCase().includes(query.toLowerCase()));
    if (fOutcome !== "all")
      r = r.filter((c) =>
        fOutcome === "none"
          ? !c.outcome?.documentedOutcome
          : c.outcome?.documentedOutcome === fOutcome
      );
    if (fCbct !== "all")
      r = r.filter((c) =>
        fCbct === "yes" ? c.cbctAvailable : fCbct === "no" ? !c.cbctAvailable : true
      );
    if (fEligibility !== "all") r = r.filter((c) => c.eligibility === fEligibility);
    if (fPred !== "all")
      r = r.filter((c) =>
        fPred === "completed"
          ? c.prediction?.status === "Completed"
          : fPred === "pending"
          ? c.prediction?.status === "Pending" || !c.prediction
          : true
      );

    r.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortKey) {
        case "createdAt": av = +new Date(a.createdAt); bv = +new Date(b.createdAt); break;
        case "age": av = a.age; bv = b.age; break;
        case "caseId": av = a.caseId; bv = b.caseId; break;
        case "prediction": av = a.prediction?.probability ?? 0; bv = b.prediction?.probability ?? 0; break;
      }
      const cmp = typeof av === "string" ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [cases, query, fOutcome, fCbct, fEligibility, fPred, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const allPageSelected = paged.length > 0 && paged.every((c) => selectedIds.includes(c.id));
  const somePageSelected = paged.some((c) => selectedIds.includes(c.id)) && !allPageSelected;

  const handleToggleAllPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paged.some((c) => c.id === id)));
    } else {
      const pageIds = paged.map((c) => c.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleCase = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(filtered.map((c) => c.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  }

  const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                placeholder="Search case ID…"
                className="h-9 pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={fOutcome} onValueChange={(v) => { setFOutcome(v); setPage(0); }}>
                <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Outcome" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All outcomes</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="none">No outcome</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fCbct} onValueChange={(v) => { setFCbct(v); setPage(0); }}>
                <SelectTrigger className="h-9 w-36"><SelectValue placeholder="CBCT" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All CBCT</SelectItem>
                  <SelectItem value="yes">Available</SelectItem>
                  <SelectItem value="no">Unavailable</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fEligibility} onValueChange={(v) => { setFEligibility(v); setPage(0); }}>
                <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Eligibility" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All eligibility</SelectItem>
                  <SelectItem value="Eligible">Eligible</SelectItem>
                  <SelectItem value="Requires Review">Requires Review</SelectItem>
                  <SelectItem value="Excluded">Excluded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fPred} onValueChange={(v) => { setFPred(v); setPage(0); }}>
                <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Prediction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All predictions</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setFOutcome("all"); setFCbct("all"); setFEligibility("all"); setFPred("all"); }}>
                <Filter className="h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={handleRefresh}
              className="gap-1.5 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
              title="Sync latest research cases from Supabase Cloud"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              {refreshing ? "Syncing..." : "Sync Cloud"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Import dataset", description: "Open the Dataset view to upload CSV/Excel." })}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Export started", description: "Filtered cases exported as CSV (demo)." })}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" className="bg-brand-gradient text-white shrink-0" onClick={openNewCase}>
              <Plus className="h-4 w-4" /> <span className="sm:hidden">New Case</span><span className="hidden sm:inline">New Research Case</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Table & Bulk Operations */}
      <Card className="overflow-hidden">
        {/* Bulk Action Bar when items selected */}
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2.5 dark:bg-primary/15"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {selectedIds.length}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-foreground">
                  {selectedIds.length} {selectedIds.length === 1 ? "case" : "cases"} selected
                </span>
                {selectedIds.length < filtered.length && (
                  <button
                    onClick={handleSelectAllFiltered}
                    className="ml-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    (Select all {filtered.length} filtered cases)
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Deselect All
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (!isAdmin) {
                    toast({
                      title: "Admin Privilege Required",
                      description: `Only research platform administrators can delete case records. Your current role is "${currentUser?.role || "Researcher"}".`,
                      variant: "destructive",
                    });
                    return;
                  }
                  setBulkDeleteOpen(true);
                }}
                className="h-7 gap-1.5 text-xs font-semibold shadow-xs"
              >
                {isAdmin ? <Trash2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filtered.length}</span> research cases ·
              de-identified
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-1.5"
              title="Force sync from Supabase Cloud"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
              {refreshing ? "Syncing..." : "Sync"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="h-7 w-16"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="hidden overflow-x-auto scrollbar-medical sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="w-10 px-3 py-2.5 text-center">
                  <Checkbox
                    checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                    onCheckedChange={handleToggleAllPage}
                    aria-label="Select all on this page"
                    title="Select all on this page"
                  />
                </th>
                <Th onClick={() => toggleSort("caseId")} active={sortKey === "caseId"} dir={sortDir}>Case ID</Th>
                <Th onClick={() => toggleSort("age")} active={sortKey === "age"} dir={sortDir}>Age</Th>
                <th className="px-3 py-2.5 font-medium">Sex</th>
                <th className="px-3 py-2.5 font-medium">Implant Site</th>
                <th className="px-3 py-2.5 font-medium">CBCT Quality</th>
                <th className="px-3 py-2.5 font-medium">Eligibility</th>
                <th className="px-3 py-2.5 font-medium">Prediction</th>
                <th className="px-3 py-2.5 font-medium">Actual Outcome</th>
                <Th onClick={() => toggleSort("createdAt")} active={sortKey === "createdAt"} dir={sortDir}>Created</Th>
                <th className="px-6 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center">
                    <EmptyState
                      title="No research cases found"
                      desc="Try adjusting filters, or create your first research case to begin."
                      action={<Button className="bg-brand-gradient text-white" onClick={openNewCase}><Plus className="h-4 w-4" /> New Research Case</Button>}
                    />
                  </td>
                </tr>
              ) : (
                paged.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-b border-border/60 transition-colors hover:bg-muted/40",
                        isSelected && "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <td className="w-10 px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleCase(c.id)}
                          aria-label={`Select case ${c.caseId}`}
                        />
                      </td>
                      <td className="px-6 py-3 font-mono text-xs font-medium text-primary">{c.caseId}</td>
                      <td className="px-3 py-3">{c.age}</td>
                      <td className="px-3 py-3">{c.sex}</td>
                      <td className="px-3 py-3">{c.implantSite}</td>
                      <td className="px-3 py-3">
                        <Badge variant={c.cbctAvailable ? "secondary" : "outline"} className="text-[10px]">
                          {c.cbctAvailable ? c.cbctQuality : "N/A"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className={cn("text-[10px]", c.eligibility === "Eligible" ? "border-emerald-200 text-emerald-700" : c.eligibility === "Requires Review" ? "border-amber-200 text-amber-700" : "border-red-200 text-red-600")}>
                          {c.eligibility}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        {c.prediction ? (
                          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", c.prediction.predictedOutcome === "Success" ? "text-emerald-600" : "text-red-500")}>
                            {c.prediction.predictedOutcome}
                            <span className="text-muted-foreground">· {Math.round(c.prediction.probability * 100)}%</span>
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {c.outcome?.documentedOutcome ? (
                          <Badge variant="outline" className={cn("text-[10px]", c.outcome.documentedOutcome === "Success" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-600")}>
                            {c.outcome.documentedOutcome}
                          </Badge>
                        ) : <span className="text-xs text-muted-foreground">Pending</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{c.createdAt.slice(0, 10)}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconAction label="View" onClick={() => setSelectedCase(c.id)}><Eye className="h-3.5 w-3.5" /></IconAction>
                          <IconAction label="Edit" onClick={() => { setSelectedCase(c.id); }}><Pencil className="h-3.5 w-3.5" /></IconAction>
                          <IconAction label="Prediction" onClick={() => { setSelectedCase(c.id); setView("prediction"); }}><Brain className="h-3.5 w-3.5" /></IconAction>
                          <IconAction label="Report" onClick={() => { setView("reports"); }}><FileText className="h-3.5 w-3.5" /></IconAction>
                          <IconAction
                            label={isAdmin ? "Delete Case (Admin Only)" : "Delete Restricted (Admin Only)"}
                            danger
                            onClick={() => {
                              if (!isAdmin) {
                                toast({
                                  title: "Admin Privilege Required",
                                  description: `Only research platform administrators can delete case records. Your current role is "${currentUser?.role || "Researcher"}".`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              setCaseToDelete(c);
                            }}
                          >
                            {isAdmin ? (
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600 transition-colors" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 opacity-40 hover:opacity-90 transition-opacity" />
                            )}
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="space-y-2 p-3 sm:hidden">
          {paged.length === 0 ? (
            <EmptyState
              title="No research cases found"
              desc="Try adjusting filters, or create your first case."
              action={<Button className="bg-brand-gradient text-white" onClick={openNewCase}><Plus className="h-4 w-4" /> New</Button>}
            />
          ) : (
            paged.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  className={cn(
                    "rounded-xl border border-border bg-card p-3 transition-colors",
                    isSelected && "border-primary/50 bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleCase(c.id)}
                        aria-label={`Select case ${c.caseId}`}
                      />
                      <button onClick={() => setSelectedCase(c.id)} className="text-left">
                        <span className="font-mono text-xs font-semibold text-primary">{c.caseId}</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{c.createdAt.slice(0, 10)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-foreground">
                    <span>{c.age}y</span><span className="text-muted-foreground">·</span>
                    <span>{c.sex}</span><span className="text-muted-foreground">·</span>
                    <span className="truncate">{c.implantSite}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant={c.cbctAvailable ? "secondary" : "outline"} className="text-[10px]">{c.cbctAvailable ? c.cbctQuality : "N/A"}</Badge>
                    <Badge variant="outline" className={cn("text-[10px]", c.eligibility === "Eligible" ? "border-emerald-200 text-emerald-700" : c.eligibility === "Requires Review" ? "border-amber-200 text-amber-700" : "border-red-200 text-red-600")}>{c.eligibility}</Badge>
                    {c.prediction && (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", c.prediction.predictedOutcome === "Success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                        {c.prediction.predictedOutcome} · {Math.round(c.prediction.probability * 100)}%
                      </span>
                    )}
                    {c.outcome?.documentedOutcome && (
                      <Badge variant="outline" className={cn("text-[10px]", c.outcome.documentedOutcome === "Success" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-600")}>Actual: {c.outcome.documentedOutcome}</Badge>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {isAdmin ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[10px] inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Admin
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">Read-only</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <IconAction label="View" onClick={() => setSelectedCase(c.id)}><Eye className="h-3.5 w-3.5" /></IconAction>
                      <IconAction label="Prediction" onClick={() => { setSelectedCase(c.id); setView("prediction"); }}><Brain className="h-3.5 w-3.5" /></IconAction>
                      <IconAction label="Report" onClick={() => { setView("reports"); }}><FileText className="h-3.5 w-3.5" /></IconAction>
                      <IconAction
                        label={isAdmin ? "Delete Case" : "Admin Only"}
                        danger
                        onClick={() => {
                          if (!isAdmin) {
                            toast({
                              title: "Admin Privilege Required",
                              description: "Only administrators can delete research records.",
                              variant: "destructive",
                            });
                            return;
                          }
                          setCaseToDelete(c);
                        }}
                      >
                        {isAdmin ? (
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600 transition-colors" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 opacity-40 hover:opacity-90 transition-opacity" />
                        )}
                      </IconAction>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            Page {safePage + 1} of {pageCount} · {filtered.length} cases
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <CaseDetailSheet caseData={selectedCase} onRequestDelete={(c) => setCaseToDelete(c)} />

      {/* Admin Single Delete Confirmation Modal */}
      <AlertDialog open={!!caseToDelete} onOpenChange={(open) => !open && setCaseToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" /> Permanently Delete Case Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <p>
                You are about to delete research record{" "}
                <strong className="font-mono text-foreground font-bold">{caseToDelete?.caseId}</strong>{" "}
                ({caseToDelete?.age}y · {caseToDelete?.sex} · {caseToDelete?.implantSite}).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This operation will remove the case from the active research dataset, synchronize deletion across all logged-in devices via Supabase Cloud, and record an immutable audit log entry under Admin{" "}
                <strong className="text-foreground">{currentUser?.name}</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCaseToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (caseToDelete) {
                  const targetId = caseToDelete.id;
                  const ok = deleteCase(targetId);
                  if (ok) {
                    setSelectedIds((prev) => prev.filter((id) => id !== targetId));
                    toast({
                      title: "Research Case Deleted",
                      description: `Case ${caseToDelete.caseId} was permanently removed.`,
                    });
                  } else {
                    toast({
                      title: "Deletion Failed",
                      description: "Admin permissions required.",
                      variant: "destructive",
                    });
                  }
                  setCaseToDelete(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700 font-semibold"
            >
              Delete Case (Admin)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Bulk Delete Confirmation Modal */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" /> Permanently Delete {selectedIds.length} Cases?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <p>
                You have selected <strong className="font-bold text-foreground">{selectedIds.length}</strong> research cases for permanent batch removal.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                These cases will be tombstoned and permanently deleted from both local storage and Supabase Cloud. They will not reappear when the page is reloaded. An audit trail entry will be logged under Admin <strong className="text-foreground">{currentUser?.name}</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const count = selectedIds.length;
                const ok = deleteCases(selectedIds);
                if (ok) {
                  toast({
                    title: "Cases Deleted Successfully",
                    description: `Permanently removed ${count} research cases from database and cloud.`,
                  });
                  setSelectedIds([]);
                } else {
                  toast({
                    title: "Bulk Deletion Failed",
                    description: "Admin permissions required.",
                    variant: "destructive",
                  });
                }
                setBulkDeleteOpen(false);
              }}
              className="bg-red-600 text-white hover:bg-red-700 font-semibold"
            >
              Delete {selectedIds.length} Cases (Admin)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Th({ children, onClick, active, dir }: { children: React.ReactNode; onClick?: () => void; active?: boolean; dir?: "asc" | "desc" }) {
  return (
    <th className="px-6 py-2.5 font-medium">
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
        {children}
        <ArrowUpDown className={cn("h-3 w-3 transition-opacity", active ? "opacity-100" : "opacity-30")} />
        {active && <span className="text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

function IconAction({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors",
        danger
          ? "hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          : "hover:bg-primary/10 hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, desc, action }: { title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient-soft text-primary">
        <ClipboardCheck className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {action}
    </div>
  );
}

function CaseDetailSheet({
  caseData,
  onRequestDelete,
}: {
  caseData: ResearchCase | null;
  onRequestDelete?: (c: ResearchCase) => void;
}) {
  const { setSelectedCase, setView, currentUser } = useAppStore();
  const isAdmin = currentUser?.role === "Admin";
  const open = !!caseData;
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setSelectedCase(null); }}>
      <SheetContent className="w-full overflow-y-auto scrollbar-medical sm:max-w-xl p-0">
        {caseData && (
          <>
            <SheetHeader className="border-b border-border bg-brand-gradient-soft px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="font-mono text-base text-primary">{caseData.caseId}</SheetTitle>
                  <SheetDescription>
                    {caseData.age}y · {caseData.sex} · {caseData.implantSite}
                  </SheetDescription>
                </div>
                <Badge variant="outline" className={cn(caseData.eligibility === "Eligible" ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700")}>
                  {caseData.eligibility}
                </Badge>
              </div>
            </SheetHeader>

            <div className="space-y-5 p-6">
              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => setView("cbct")}><ScanLine className="h-4 w-4" /> CBCT Features</Button>
                <Button size="sm" variant="outline" onClick={() => setView("prediction")}><Brain className="h-4 w-4" /> AI Prediction</Button>
              </div>

              <Section title="Case Information">
                <Grid>
                  <Field label="Case ID" value={caseData.caseId} mono />
                  <Field label="Age" value={String(caseData.age)} />
                  <Field label="Sex" value={caseData.sex} />
                  <Field label="Implant Site" value={caseData.implantSite} />
                  <Field label="Tooth Position" value={caseData.toothPosition} />
                  <Field label="CBCT Available" value={caseData.cbctAvailable ? "Yes" : "No"} />
                  <Field label="CBCT Quality" value={caseData.cbctQuality} />
                  <Field label="Status" value={caseData.status} />
                </Grid>
              </Section>

              <Section title="Eligibility">
                <ul className="space-y-1.5">
                  {Object.entries(caseData.eligibilityChecks).map(([k, v]) => (
                    <li key={k} className="flex items-center gap-2 text-xs">
                      <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[9px] text-white", v ? "bg-emerald-500" : "bg-red-400")}>
                        {v ? "✓" : "✕"}
                      </span>
                      <span className="text-foreground">{k}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="CBCT Features" icon={ScanLine}>
                <Grid>
                  <Field label="Bone Density (HU)" value={caseData.cbct.boneDensityHu?.toString() ?? "—"} />
                  <Field label="Bone Quality" value={caseData.cbct.boneQuality ?? "—"} />
                  <Field label="Buccolingual Width (mm)" value={caseData.cbct.buccolingualWidth?.toString() ?? "—"} />
                  <Field label="Apicocoronal Height (mm)" value={caseData.cbct.apicocoronalHeight?.toString() ?? "—"} />
                  <Field label="Cortical Thickness (mm)" value={caseData.cbct.corticalBoneThickness?.toString() ?? "—"} />
                  <Field label="Assessment Status" value={caseData.cbct.assessmentStatus} />
                </Grid>
              </Section>

              <Section title="Clinical Data" icon={Activity}>
                <Grid>
                  <Field label="Smoking Status" value={caseData.clinical.smokingStatus ?? "—"} />
                  <Field label="Diabetes Status" value={caseData.clinical.diabetesStatus ?? "—"} />
                  <Field label="Bruxism" value={caseData.clinical.bruxism == null ? "—" : caseData.clinical.bruxism ? "Yes" : "No"} />
                  <Field label="Implant System" value={caseData.clinical.implantSystem} />
                  <Field label="Diameter (mm)" value={caseData.clinical.implantDiameterMm?.toString() ?? "—"} />
                  <Field label="Length (mm)" value={caseData.clinical.implantLengthMm?.toString() ?? "—"} />
                  <Field label="Loading Protocol" value={caseData.clinical.loadingProtocol ?? "—"} />
                  <Field label="Prosthetic Type" value={caseData.clinical.prostheticType ?? "—"} />
                </Grid>
              </Section>

              <Section title="Outcome">
                {caseData.outcome ? (
                  <Grid>
                    <Field label="Documented Outcome" value={caseData.outcome.documentedOutcome ?? "—"} />
                    <Field label="Follow-up (months)" value={caseData.outcome.followUpMonths?.toString() ?? "—"} />
                    <Field label="Assessment Date" value={caseData.outcome.assessmentDate?.slice(0, 10) ?? "—"} />
                    <Field label="Classification Source" value={caseData.outcome.classificationSource} />
                  </Grid>
                ) : (
                  <p className="text-xs text-muted-foreground">No documented outcome yet.</p>
                )}
              </Section>

              <Section title="AI Prediction" icon={Brain}>
                {caseData.prediction ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-xl border px-4 py-3", caseData.prediction.predictedOutcome === "Success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600")}>
                        <p className="text-[10px] uppercase tracking-wide opacity-70">Predicted</p>
                        <p className="text-lg font-semibold">{caseData.prediction.predictedOutcome}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Probability</p>
                        <p className="text-lg font-semibold text-foreground">{Math.round(caseData.prediction.probability * 100)}%</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-[10px] uppercase text-muted-foreground">Model</p>
                        <p className="text-xs font-medium text-foreground">{caseData.prediction.algorithm} {caseData.prediction.modelVersion}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] text-muted-foreground">{STUDY_META.disclaimer}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No prediction generated.</p>
                )}
              </Section>

              <Separator />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Created {caseData.createdAt.slice(0, 10)} by {caseData.createdBy}</span>
                <span>Updated {caseData.updatedAt.slice(0, 10)}</span>
              </div>

              {/* Administrative Deletion Actions */}
              <div className="pt-2">
                {isAdmin ? (
                  <div className="rounded-xl border border-red-200/70 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-semibold text-red-900 dark:text-red-300">
                          Administrator Record Control
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-red-200 bg-white text-red-700 dark:bg-red-950/50 dark:text-red-300">
                        Admin Only
                      </Badge>
                    </div>
                    <p className="text-[11px] text-red-700/80 dark:text-red-300/80 leading-relaxed">
                      Permanently delete this research case and remove it from the retrospective dataset across all connected devices.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRequestDelete?.(caseData)}
                      className="w-full mt-1 border-red-300 bg-white text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-950/60 dark:border-red-800 dark:text-red-300 transition-colors font-medium text-xs gap-1.5 shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Case {caseData.caseId} (Admin)
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/70 bg-muted/40 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground text-xs">Record Deletion Restricted</p>
                        <p className="text-[10px] text-muted-foreground">Admin role required to delete research cases.</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Role: {currentUser?.role || "Researcher"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-3">{children}</div>;
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}
