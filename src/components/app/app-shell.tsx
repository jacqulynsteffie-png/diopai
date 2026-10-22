"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope,
  Sparkles,
  RefreshCw,
  Moon,
  Sun,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { MobileNav } from "./mobile-nav";
import { LoginView } from "@/components/views/login-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { CasesView } from "@/components/views/cases-view";
import { NewCaseWizard } from "@/components/views/new-case-wizard";
import { CbctView } from "@/components/views/cbct-view";
import { CbctWorkspace } from "@/components/views/cbct-workspace";
import { ClinicalView } from "@/components/views/clinical-view";
import { OutcomesView } from "@/components/views/outcomes-view";
import { PredictionView } from "@/components/views/prediction-view";
import { PatientConsultationView } from "@/components/views/patient-consultation-view";
import { ModelPerformanceView } from "@/components/views/model-performance-view";
import { FeatureAnalysisView } from "@/components/views/feature-analysis-view";
import { DatasetView } from "@/components/views/dataset-view";
import { ReportsView } from "@/components/views/reports-view";
import { AuditView } from "@/components/views/audit-view";
import { UsersView } from "@/components/views/users-view";
import { SettingsView } from "@/components/views/settings-view";

const VIEW_COMPONENTS: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  cases: CasesView,
  "cbct-workspace": CbctWorkspace,
  cbct: CbctView,
  clinical: ClinicalView,
  outcomes: OutcomesView,
  prediction: PredictionView,
  "model-performance": ModelPerformanceView,
  "feature-analysis": FeatureAnalysisView,
  dataset: DatasetView,
  reports: ReportsView,
  audit: AuditView,
  users: UsersView,
  settings: SettingsView,
};

interface AppShellProps {
  initialLoginMode?: "research" | "consultation";
}

export function AppShell({ initialLoginMode }: AppShellProps) {
  const { authenticated, view, loginMode, hydrateFromDb, syncToCloud, logout, currentUser } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [syncing, setSyncing] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Automatically pull latest data from Supabase Cloud on load
    hydrateFromDb();

    // Re-sync whenever user returns to or focuses the tab (e.g. mobile browser reopened)
    const onSync = () => {
      hydrateFromDb();
    };
    window.addEventListener("focus", onSync);
    document.addEventListener("visibilitychange", onSync);

    // Periodically sync every 15 seconds so phone & desktop remain constant
    const interval = setInterval(() => {
      hydrateFromDb();
    }, 15000);

    return () => {
      window.removeEventListener("focus", onSync);
      document.removeEventListener("visibilitychange", onSync);
      clearInterval(interval);
    };
  }, [hydrateFromDb]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await hydrateFromDb();
      toast({
        title: "Cloud Synchronized",
        description: "Clinical patient data pulled and synchronized with Supabase Cloud.",
      });
    } catch {
      toast({
        title: "Sync Status",
        description: "Synchronized with local and cloud stores.",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (!authenticated) {
    return <LoginView initialMode={initialLoginMode ?? loginMode} />;
  }

  // 1. ISOLATED PATIENT AI CONSULTATION PORTAL (DASHBOARD ALONE, PATIENT DETAILS ALONE)
  if (loginMode === "consultation") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Dedicated Clinical Consultation Header */}
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Mobile View: Perfectly Centered, Large Prominent Brand Logo */}
            <div className="flex flex-col items-center justify-center w-full sm:hidden text-center pb-2 border-b border-border/50">
              <BrandLogo className="h-16 w-auto max-w-[260px] object-contain drop-shadow mx-auto" />
              <div className="flex items-center gap-1.5 mt-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Live Patient AI Consultation Dashboard
                </span>
              </div>
            </div>

            {/* Desktop View: Left Brand Logo & Title */}
            <div className="hidden sm:flex items-center gap-4">
              <BrandLogo className="h-12 w-auto max-w-[200px] object-contain" />
              <div className="h-6 w-px bg-border/70 hidden md:block" />
              <div className="hidden md:flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Patient AI Consultation Dashboard</span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[10px] px-2 py-0.5">
                    Clinical Portal
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Individual patient intake, CBCT anatomy parameters, &amp; AI feasibility plan
                </span>
              </div>
            </div>

            {/* Header Right Actions: Clinician badge, Sync, Theme, Logout */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1 text-xs">
                  <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-foreground text-xs truncate max-w-[130px] sm:max-w-[180px]">
                    {currentUser.name || "Dr. S. Implantologist"}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="h-8 px-2.5 text-xs gap-1 border-border/80"
                  title="Sync patient records with Supabase cloud"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-emerald-600" : ""}`} />
                  <span className="hidden md:inline">Sync</span>
                </Button>

                {mounted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="h-8 w-8 p-0 border-border/80"
                    title="Toggle Theme"
                  >
                    {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  toast({
                    title: "Signed Out",
                    description: "Clinical consultation session closed.",
                  });
                }}
                className="h-8 text-xs font-medium border-rose-500/30 text-rose-600 hover:bg-rose-500/10 gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Exit Portal</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Clinical Body: ONLY The Dashboard Alone (Patient Details Intake & Feasibility Plan) */}
        <main className="flex-1 overflow-x-clip px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1500px]">
            <PatientConsultationView />
          </div>
        </main>

        {/* Dedicated Clinical Consultation Footer */}
        <footer className="border-t border-border/70 bg-card/40 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-2 text-[11px] text-muted-foreground sm:flex-row">
            <p>Diop AI Clinical Decision Support · Patient AI Consultation Dashboard</p>
            <p>Clinical specialist intake &amp; patient-specific CBCT implant feasibility assessment</p>
          </div>
        </footer>
      </div>
    );
  }

  // 2. RESEARCH PLATFORM (PATIENT CONSULTATION COMPLETELY REMOVED FROM ALL DASHBOARDS)
  const ViewComponent = VIEW_COMPONENTS[view] ?? DashboardView;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-clip">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mx-auto w-full max-w-[1500px] px-3 py-4 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:pb-8"
            >
              <ViewComponent />
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="mt-auto border-t border-border/70 bg-card/40 px-4 py-4 pb-20 sm:px-6 lg:pb-4">
          <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-2 text-[11px] text-muted-foreground sm:flex-row">
            <p>Diop AI Research · Retrospective study</p>
            <p>Research-use only. Not a clinical diagnostic device. v1.0</p>
          </div>
        </footer>
      </div>
      <MobileNav />
      <CommandPalette />
      <NewCaseWizard />
    </div>
  );
}
