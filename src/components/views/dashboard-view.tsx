"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FolderSearch,
  ClipboardCheck,
  Brain,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Search,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OutcomeClass } from "@/lib/types";
import { STUDY_META } from "@/lib/types";

const outcomeColors: Record<string, string> = {
  Success: "#0F766E",
  Failure: "#DC2626",
  "No Outcome": "#94A3B8",
};

export function DashboardView() {
  const { cases, models, stats, openNewCase, setView, setSelectedCase } = useAppStore();
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [outcomeFilter, setOutcomeFilter] = React.useState("all");

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const activeModel = models.find((m) => m.algorithm === "XGBoost") ?? models[0];

  const eligible = cases.filter((c) => c.eligibility === "Eligible").length;
  const predictions = cases.filter((c) => c.prediction && c.prediction.status === "Completed").length;

  // outcome distribution
  const outcomes: { name: string; value: number }[] = (() => {
    const s = cases.filter((c) => c.outcome?.documentedOutcome === "Success").length;
    const f = cases.filter((c) => c.outcome?.documentedOutcome === "Failure").length;
    const n = cases.filter((c) => !c.outcome?.documentedOutcome).length;
    return [
      { name: "Success", value: s },
      { name: "Failure", value: f },
      { name: "No Outcome", value: n },
    ];
  })();

  // prediction activity (last 8 weeks synthetic)
  const predActivity = (() => {
    const weeks = Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, predictions: 0, cases: 0 }));
    cases.forEach((c) => {
      const ageDays = (Date.now() - +new Date(c.createdAt)) / 86400000;
      const w = Math.min(7, Math.max(0, Math.floor(ageDays / 7)));
      weeks[w].cases += 1;
      if (c.prediction) weeks[w].predictions += 1;
    });
    return weeks.reverse();
  })();

  // dataset quality
  const dsQuality = (() => {
    const total = cases.length;
    const missing = cases.filter((c) => c.cbct.assessmentStatus !== "Entered").length;
    const invalid = cases.filter((c) => !c.cbctAvailable).length;
    const ok = total - missing - invalid;
    return [
      { name: "Complete", value: ok, color: "#0F766E" },
      { name: "Partial", value: missing, color: "#F59E0B" },
      { name: "Invalid", value: invalid, color: "#DC2626" },
    ];
  })();

  // model perf mini line
  const perfTrend = (() => {
    const m = activeModel?.metrics;
    if (!m) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      epoch: i + 1,
      auc: parseFloat((0.6 + (m.rocAuc - 0.6) * ((i + 1) / 8)).toFixed(3)),
      loss: parseFloat((0.7 - 0.55 * ((i + 1) / 8)).toFixed(3)),
    }));
  })();

  const statsCards = [
    {
      label: "Total Research Cases",
      value: stats.totalCases,
      desc: "Retrospective records",
      icon: FolderSearch,
      trend: "+8 this week",
      up: true,
      accent: "from-blue-500 to-cyan-500",
    },
    {
      label: "Eligible Cases",
      value: eligible,
      desc: `${Math.round((eligible / stats.totalCases) * 100)}% of total`,
      icon: ClipboardCheck,
      trend: "Eligibility applied",
      up: true,
      accent: "from-teal-500 to-emerald-500",
    },
    {
      label: "Predictions Generated",
      value: predictions,
      desc: "AI outcome predictions",
      icon: Brain,
      trend: "+12 this week",
      up: true,
      accent: "from-cyan-500 to-blue-500",
    },
    {
      label: "Current Model",
      value: "XGBoost v1.0",
      desc: activeModel?.status ?? "—",
      icon: Cpu,
      trend: `ROC-AUC ${activeModel?.rocAuc ?? "—"}`,
      up: true,
      accent: "from-violet-500 to-fuchsia-500",
      isText: true,
    },
  ];

  // recent cases (filtered)
  const recent = cases
    .filter((c) =>
      query ? c.caseId.toLowerCase().includes(query.toLowerCase()) : true
    )
    .filter((c) =>
      outcomeFilter === "all"
        ? true
        : outcomeFilter === "success"
        ? c.outcome?.documentedOutcome === "Success"
        : outcomeFilter === "failure"
        ? c.outcome?.documentedOutcome === "Failure"
        : outcomeFilter === "none"
        ? !c.outcome?.documentedOutcome
        : true
    )
    .slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Hero / study banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-medical relative overflow-hidden rounded-2xl border border-border p-6 sm:p-8"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
        <div className="absolute right-6 top-6 hidden items-center gap-1.5 sm:flex">
          <span className="pulse-dot h-2 w-2 bg-cyan-500" />
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Research pipeline active</span>
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-3 border-primary/20 bg-brand-gradient-soft text-primary">
              {STUDY_META.design}
            </Badge>
            <h2 className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {STUDY_META.shortTitle}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              AI-based predictive model for dental implant outcomes based on preoperative
              CBCT-derived features.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openNewCase} className="bg-brand-gradient text-white">
              + New Research Case
            </Button>
            <Button variant="outline" onClick={() => setView("prediction")}>
              Run Prediction
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((s, i) =>
          loading ? (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ) : (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="h-full"
            >
              <Card className="card-medical group relative h-full overflow-hidden border-border transition-shadow hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/30">
                <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", s.accent)} />
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", s.accent)}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11px] font-medium whitespace-nowrap", s.up ? "text-emerald-600" : "text-red-500")}>
                      {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {s.trend}
                    </span>
                  </div>
                  <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                  <div className={cn("mt-0.5 font-semibold tracking-tight text-foreground", s.isText ? "truncate text-lg" : "text-2xl tabular-nums")}>
                    {s.isText ? s.value : <Counter value={s.value as number} />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        )}
      </div>

      {/* Analytics row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Outcome distribution — donut */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Outcome Distribution</CardTitle>
            <CardDescription>Documented implant outcomes (configurable definition)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomes}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {outcomes.map((e) => (
                      <Cell key={e.name} fill={outcomeColors[e.name] ?? "#94A3B8"} />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      background: "#fff",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs">
              {outcomes.map((o) => (
                <div key={o.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: outcomeColors[o.name] }} />
                  <span className="text-muted-foreground">{o.name}</span>
                  <span className="font-semibold text-foreground">{o.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prediction activity — area */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Prediction Activity</CardTitle>
              <CardDescription>Cases and AI predictions over the last 8 weeks</CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" /> Trending up
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predActivity} margin={{ left: -16, right: 8, top: 10 }}>
                  <defs>
                    <linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
                  <Area type="monotone" dataKey="cases" stroke="#06B6D4" strokeWidth={2} fill="url(#gCase)" />
                  <Area type="monotone" dataKey="predictions" stroke="#2563EB" strokeWidth={2} fill="url(#gPred)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500" /><span className="text-muted-foreground">Cases</span></span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /><span className="text-muted-foreground">Predictions</span></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Model performance trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>{activeModel?.algorithm} {activeModel?.version} · training curve</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView("model-performance")}>
              View details <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perfTrend} margin={{ left: -16, right: 8, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
                  <Line type="monotone" dataKey="auc" stroke="#2563EB" strokeWidth={2.5} dot={false} name="ROC-AUC" />
                  <Line type="monotone" dataKey="loss" stroke="#06B6D4" strokeWidth={2.5} dot={false} strokeDasharray="4 3" name="Loss" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /><span className="text-muted-foreground">ROC-AUC</span></span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500" /><span className="text-muted-foreground">Loss</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Dataset quality */}
        <Card>
          <CardHeader>
            <CardTitle>Dataset Quality</CardTitle>
            <CardDescription>Completeness across research cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dsQuality} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={72} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                    {dsQuality.map((e) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
              <span className="text-muted-foreground">Quality score</span>
              <span className="font-semibold text-foreground">{Math.round((cases.filter(c => c.cbct.assessmentStatus === "Entered").length / cases.length) * 100)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Model Status */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>AI Model Status</CardTitle>
            <CardDescription>Current production research model</CardDescription>
          </div>
          <Badge className={cn("gap-1", activeModel?.status === "Validated" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700")}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> {activeModel?.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { l: "Algorithm", v: activeModel?.algorithm },
              { l: "Version", v: activeModel?.version },
              { l: "Last trained", v: activeModel?.trainedAt?.slice(0, 10) ?? "—" },
              { l: "Features", v: activeModel?.featureList.length ?? 0 },
              { l: "ROC-AUC", v: activeModel?.rocAuc ?? "—" },
              { l: "Validation", v: activeModel?.validationStrategy.split(" (")[0] },
            ].map((m) => (
              <div key={m.l} className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{m.l}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{m.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            Performance values are research-use metrics. Not validated clinical performance.
          </p>
        </CardContent>
      </Card>

      {/* Recent research cases */}
      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Recent Research Cases</CardTitle>
            <CardDescription>Most recently created de-identified case records</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search case ID…"
                className="h-9 pl-8 sm:w-48"
              />
            </div>
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="h-9 sm:w-40">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="none">No outcome</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setView("cases")}>
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto scrollbar-medical sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-2.5 font-medium">Case ID</th>
                  <th className="px-3 py-2.5 font-medium">Age</th>
                  <th className="px-3 py-2.5 font-medium">Implant Site</th>
                  <th className="px-3 py-2.5 font-medium">CBCT</th>
                  <th className="px-3 py-2.5 font-medium">Prediction</th>
                  <th className="px-3 py-2.5 font-medium">Actual</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-6 py-2.5 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/60">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-3"><Skeleton className="h-4 w-16" /></td>
                      ))}
                    </tr>
                  ))
                ) : recent.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No research cases match the filter.
                    </td>
                  </tr>
                ) : (
                  recent.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedCase(c.id);
                        setView("cases");
                      }}
                      className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-6 py-3 font-mono text-xs font-medium text-primary">{c.caseId}</td>
                      <td className="px-3 py-3 text-foreground">{c.age}</td>
                      <td className="px-3 py-3 text-foreground">{c.implantSite}</td>
                      <td className="px-3 py-3">
                        <Badge variant={c.cbctAvailable ? "secondary" : "outline"} className="text-[10px]">
                          {c.cbctAvailable ? c.cbctQuality : "N/A"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        {c.prediction ? (
                          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", c.prediction.predictedOutcome === "Success" ? "text-emerald-600" : "text-red-500")}>
                            {c.prediction.predictedOutcome}
                            <span className="text-muted-foreground">· {Math.round(c.prediction.probability * 100)}%</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {c.outcome?.documentedOutcome ? (
                          <Badge variant="outline" className={cn("text-[10px]", c.outcome.documentedOutcome === "Success" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-600")}>
                            {c.outcome.documentedOutcome}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                      </td>
                      <td className="px-6 py-3 text-right text-xs text-muted-foreground">{c.createdAt.slice(0, 10)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="space-y-2 p-3 sm:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-3">
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
            ) : recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No research cases match the filter.</p>
            ) : (
              recent.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCase(c.id); setView("cases"); }}
                  className="w-full rounded-xl border border-border bg-card p-3 text-left transition-colors active:bg-muted/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">{c.caseId}</span>
                    <span className="text-[10px] text-muted-foreground">{c.createdAt.slice(0, 10)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-foreground">
                    <span>{c.age}y</span><span className="text-muted-foreground">·</span>
                    <span className="truncate">{c.implantSite}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant={c.cbctAvailable ? "secondary" : "outline"} className="text-[10px]">{c.cbctAvailable ? c.cbctQuality : "N/A"}</Badge>
                    {c.prediction && (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", c.prediction.predictedOutcome === "Success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                        {c.prediction.predictedOutcome} · {Math.round(c.prediction.probability * 100)}%
                      </span>
                    )}
                    {c.outcome?.documentedOutcome && (
                      <Badge variant="outline" className={cn("text-[10px]", c.outcome.documentedOutcome === "Success" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-600")}>
                        Actual: {c.outcome.documentedOutcome}
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Counter({ value }: { value: number }) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 700);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}
