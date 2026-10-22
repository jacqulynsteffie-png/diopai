"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
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

export function AppShell() {
  const { authenticated, view, hydrateFromDb } = useAppStore();

  React.useEffect(() => {
    // Automatically pull latest research data from Supabase Cloud on load
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

  if (!authenticated) return <LoginView />;

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
              className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8"
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
