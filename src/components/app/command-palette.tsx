"use client";

import * as React from "react";
import {
  Search,
  LayoutDashboard,
  FolderSearch,
  ScanLine,
  Stethoscope,
  Target,
  Brain,
  Activity,
  BarChart3,
  Database,
  FileText,
  ShieldCheck,
  Users,
  Settings,
  Sparkles,
  Cpu,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { ViewId } from "@/lib/types";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface CmdItem {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const {
    paletteOpen,
    setPalette,
    setView,
    cases,
    models,
    openNewCase,
  } = useAppStore();

  const navActions: CmdItem[] = [
    { id: "dashboard", label: "Dashboard", hint: "Research overview", icon: LayoutDashboard, group: "Navigation", action: () => setView("dashboard") },
    { id: "cases", label: "Research Cases", hint: "Case records", icon: FolderSearch, group: "Navigation", action: () => setView("cases") },
    { id: "cbct", label: "CBCT Features", hint: "CBCT-derived features", icon: ScanLine, group: "Navigation", action: () => setView("cbct") },
    { id: "clinical", label: "Clinical Data", hint: "Clinical variables", icon: Stethoscope, group: "Navigation", action: () => setView("clinical") },
    { id: "outcomes", label: "Outcomes", hint: "Documented outcomes", icon: Target, group: "Navigation", action: () => setView("outcomes") },
    { id: "prediction", label: "AI Predictions", hint: "Outcome prediction", icon: Brain, group: "AI", action: () => setView("prediction") },
    { id: "patient-consultation", label: "Live Patient AI Consultation", hint: "Patient intake & feasibility", icon: Stethoscope, group: "AI", action: () => setView("patient-consultation") },
    { id: "model-performance", label: "Model Performance", hint: "Model evaluation", icon: Activity, group: "AI", action: () => setView("model-performance") },
    { id: "feature-analysis", label: "Feature Analysis", hint: "Feature importance", icon: BarChart3, group: "AI", action: () => setView("feature-analysis") },
    { id: "dataset", label: "Dataset", hint: "Import & validate", icon: Database, group: "Data", action: () => setView("dataset") },
    { id: "reports", label: "Research Reports", hint: "Generate reports", icon: FileText, group: "Data", action: () => setView("reports") },
    { id: "audit", label: "Audit Logs", hint: "Activity log", icon: ShieldCheck, group: "System", action: () => setView("audit") },
    { id: "users", label: "Users", hint: "Personnel", icon: Users, group: "System", action: () => setView("users") },
    { id: "settings", label: "Settings", hint: "Configuration", icon: Settings, group: "System", action: () => setView("settings") },
  ];

  const caseItems: CmdItem[] = cases.slice(0, 12).map((c) => ({
    id: c.id,
    label: c.caseId,
    hint: `${c.age}y · ${c.implantSite} · ${c.prediction?.predictedOutcome ?? "—"}`,
    icon: FolderSearch,
    group: "Research Cases",
    action: () => {
      setView("cases");
      useAppStore.getState().setSelectedCase(c.id);
    },
  }));

  const modelItems: CmdItem[] = models.map((m) => ({
    id: m.id,
    label: `${m.algorithm} ${m.version}`,
    hint: `${m.status} · ROC-AUC ${m.rocAuc ?? "—"}`,
    icon: Cpu,
    group: "Models",
    action: () => setView("model-performance"),
  }));

  // Keyboard shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setPalette]);

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPalette}>
      <CommandInput placeholder="Search cases, models, or jump to a view…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          <CommandItem
            onSelect={() => {
              openNewCase();
              setPalette(false);
            }}
          >
            <Sparkles className="mr-2 h-4 w-4 text-cyan-500" />
            <span>Create new research case</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {navActions.map((it) => (
            <CommandItem
              key={it.id}
              onSelect={() => {
                it.action();
                setPalette(false);
              }}
            >
              <it.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{it.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{it.hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {modelItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Models">
              {modelItems.map((it) => (
                <CommandItem
                  key={it.id}
                  onSelect={() => {
                    it.action();
                    setPalette(false);
                  }}
                >
                  <it.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{it.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{it.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {caseItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Research Cases">
              {caseItems.map((it) => (
                <CommandItem
                  key={it.id}
                  onSelect={() => {
                    it.action();
                    setPalette(false);
                  }}
                >
                  <it.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{it.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{it.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
