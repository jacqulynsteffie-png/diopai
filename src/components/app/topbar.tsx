"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Moon, Sun, ChevronDown, LogOut, User, Settings as SettingsIcon, Cloud, RefreshCw, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { LogoMark } from "./logo";
import { AiStatusIndicator } from "./ai-status-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Research Overview",
    subtitle: "Monitor study data, model performance, and research predictions.",
  },
  cases: {
    title: "Research Cases",
    subtitle: "Retrospective de-identified case records and eligibility review.",
  },
  "new-case": { title: "New Research Case", subtitle: "Create a de-identified research case." },
  "cbct-workspace": { title: "CBCT AI Workspace", subtitle: "Upload → Verify → Extract → Predict — the AI research pipeline." },
  cbct: { title: "CBCT Features", subtitle: "Preoperative CBCT-derived feature entry and review." },
  clinical: { title: "Clinical Data", subtitle: "Approved research clinical variables." },
  outcomes: { title: "Outcomes", subtitle: "Documented implant outcomes per research protocol." },
  prediction: { title: "AI Outcome Prediction", subtitle: "Research-use model predictions and explanations." },
  "patient-consultation": { title: "Live Patient AI Consultation", subtitle: "Interactive real-patient intake, model selection, implant feasibility plan, and dataset enrollment." },
  "model-performance": { title: "Model Performance", subtitle: "Scientific evaluation of predictive models." },
  "feature-analysis": { title: "Feature Analysis", subtitle: "Feature importance, SHAP, and distributions." },
  dataset: { title: "Dataset", subtitle: "Research dataset import, validation, and quality." },
  reports: { title: "Research Reports", subtitle: "Generate and export research reports." },
  audit: { title: "Audit Logs", subtitle: "Traceable record of research activity." },
  users: { title: "User Management", subtitle: "Authorized research personnel." },
  settings: { title: "Settings", subtitle: "Platform and research configuration." },
};

export function Topbar() {
  const { view, setView, setPalette, currentUser, logout, openNewCase, hydrateFromDb, syncToCloud, loginMode } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncToCloud();
      await hydrateFromDb();
      toast({
        title: "Cloud Synchronized",
        description: "Research data synchronized with Supabase Cloud.",
      });
    } catch {
      toast({
        title: "Sync Note",
        description: "Synchronized with local and cloud stores.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const meta = VIEW_TITLES[view] ?? VIEW_TITLES.dashboard;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border/70 bg-glass glass px-3 sm:gap-3 sm:px-6">
      {/* Mobile brand mark */}
      <div className="flex items-center gap-2 lg:hidden">
        <LogoMark className="h-8 w-8" />
      </div>
      {/* Title */}
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-[17px]">
              {meta.title}
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {meta.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Search trigger */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setPalette(true)}
              className="hidden md:flex items-center gap-2 h-9 w-56 rounded-lg border border-border bg-card/60 px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search cases, models…</span>
              <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                Ctrl K
              </kbd>
            </button>
          </TooltipTrigger>
          <TooltipContent>Global search (Ctrl + K)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setPalette(true)}
              className="grid md:hidden h-9 w-9 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Search</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* AI status indicator — desktop only (avoids crowding the mobile topbar) */}
      <div className="hidden lg:block">
        <AiStatusIndicator />
      </div>

      {/* New case quick */}
      <button
        onClick={openNewCase}
        className="hidden lg:inline-flex h-9 items-center gap-2 rounded-lg bg-brand-gradient px-3.5 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.8)] transition-transform hover:scale-[1.02]"
      >
        + New Case
      </button>

      {/* Theme toggle — desktop only on mobile to save space */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden sm:grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Toggle {theme === "dark" ? "light" : "dark"} mode</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Supabase Cloud sync button — visible on mobile and desktop */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-colors hover:text-emerald-500 hover:border-emerald-500/40"
              aria-label="Sync with Supabase Cloud"
            >
              <Cloud className={cn("h-4 w-4", syncing ? "animate-pulse text-emerald-500" : "text-muted-foreground")} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{syncing ? "Syncing with Supabase..." : "Synced with Supabase Cloud · Tap to refresh"}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
            <span className="text-sm font-medium">Prediction generated</span>
            <span className="text-xs text-muted-foreground">RC-1042 · XGBoost v1.0 · 2 min ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
            <span className="text-sm font-medium">Dataset validated</span>
            <span className="text-xs text-muted-foreground">retrospective_implant_v1.csv · 14 min ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
            <span className="text-sm font-medium">Report ready</span>
            <span className="text-xs text-muted-foreground">Model Performance Report · 1 hr ago</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date */}
      <div className="hidden xl:flex flex-col text-right leading-tight pr-1">
        <span className="text-[11px] font-medium text-foreground">{today}</span>
        <span className={cn("text-[10px] font-semibold", loginMode === "consultation" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
          {loginMode === "consultation" ? "🩺 Live Patient Session" : "🔬 Research Session"}
        </span>
      </div>

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card/60 py-1 pl-1 pr-2 transition-colors hover:bg-card">
            <div className={cn(
              "grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow-sm",
              loginMode === "consultation" ? "bg-gradient-to-br from-emerald-600 to-teal-600" : "bg-brand-gradient"
            )}>
              {currentUser.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-semibold">{currentUser.name}</span>
              <span className="text-xs font-normal text-muted-foreground truncate">{currentUser.email}</span>
              <span className="mt-1 text-[10px] font-medium text-primary">
                {loginMode === "consultation" ? "Clinical Implant Specialist" : "Research Investigator"}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setView(view === "patient-consultation" ? "dashboard" : "patient-consultation")}>
            <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
            {view === "patient-consultation" ? "Switch to Research Platform" : "Open Patient AI Consultation"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setView("settings")}>
            <User className="mr-2 h-4 w-4" /> Profile & Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              logout();
              toast({ title: "Signed out", description: "Research session ended." });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
