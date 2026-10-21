"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ResearchCase,
  ViewId,
  ModelVersion,
  DatasetRecord,
  AuditLog,
  UserRecord,
  ReportRecord,
} from "./types";
import {
  generateDemoCases,
  generateDemoModels,
  generateDemoDatasets,
  generateDemoAuditLogs,
  generateDemoUsers,
  generateDemoReports,
  DEMO_STATS,
} from "./demo-data";

interface AppState {
  // session
  authenticated: boolean;
  currentUser: { name: string; role: "Admin" | "Researcher"; email: string };
  login: () => void;
  logout: () => void;

  // navigation
  view: ViewId;
  setView: (v: ViewId) => void;
  selectedCaseId: string | null;
  setSelectedCase: (id: string | null) => void;
  // wizard state
  newCaseOpen: boolean;
  openNewCase: () => void;
  closeNewCase: () => void;

  // command palette
  paletteOpen: boolean;
  setPalette: (v: boolean) => void;

  // sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // theme
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;

  // data (demo)
  cases: ResearchCase[];
  addCase: (c: ResearchCase) => void;
  updateCase: (id: string, patch: Partial<ResearchCase>) => void;
  models: ModelVersion[];
  addModel: (m: ModelVersion) => void;
  clearResearchData: () => void;
  resetDemoData: () => void;
  datasets: DatasetRecord[];
  addDataset: (d: DatasetRecord) => void;
  auditLogs: AuditLog[];
  addAuditLog: (l: Omit<AuditLog, "id">) => void;
  users: UserRecord[];
  addUser: (u: UserRecord) => void;
  updateUser: (id: string, patch: Partial<UserRecord>) => void;
  removeUser: (id: string) => void;
  reports: ReportRecord[];
  addReport: (r: ReportRecord) => void;
  stats: typeof DEMO_STATS;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  authenticated: false,
  currentUser: {
    name: "Dr. A. Researcher",
    role: "Admin",
    email: "a.researcher@diop-ai.research",
  },
  login: () => set({ authenticated: true }),
  logout: () => set({ authenticated: false, view: "dashboard" }),

  view: "dashboard",
  setView: (v) => set({ view: v, selectedCaseId: null }),
  selectedCaseId: null,
  setSelectedCase: (id) => set({ selectedCaseId: id }),

  newCaseOpen: false,
  openNewCase: () => set({ newCaseOpen: true }),
  closeNewCase: () => set({ newCaseOpen: false }),

  paletteOpen: false,
  setPalette: (v) => set({ paletteOpen: v }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  theme: "light",
  setTheme: (t) => set({ theme: t }),

  cases: [],
  addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),
  updateCase: (id, patch) =>
    set((s) => ({
      cases: s.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  models: [],
  addModel: (m) => set((s) => ({ models: [m, ...s.models] })),
  clearResearchData: () =>
    set({
      cases: [],
      datasets: [],
      models: [],
      reports: [],
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: "System",
          action: "Cleared all research data",
          module: "System",
          caseId: null,
          status: "Warning",
          detail: "All cases, datasets, models and reports cleared.",
        },
      ],
    }),
  resetDemoData: () =>
    set({
      cases: generateDemoCases(128),
      datasets: generateDemoDatasets(),
      models: generateDemoModels(),
      reports: generateDemoReports(),
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: "System",
          action: "Reset to sample dataset",
          module: "System",
          caseId: null,
          status: "Success",
          detail: "Research dataset restored.",
        },
      ],
    }),
  datasets: [],
  addDataset: (d) => set((s) => ({ datasets: [d, ...s.datasets] })),
  auditLogs: [],
  addAuditLog: (l) =>
    set((s) => ({
      auditLogs: [
        { ...l, id: `log_${Date.now()}_${Math.floor(Math.random() * 999)}` },
        ...s.auditLogs,
      ],
    })),
  users: generateDemoUsers(),
  addUser: (u) => set((s) => ({ users: [u, ...s.users] })),
  updateUser: (id, patch) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
  removeUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
  reports: [],
  addReport: (r) => set((s) => ({ reports: [r, ...s.reports] })),
  stats: DEMO_STATS,
    }),
    {
      name: "diop-ai-research-v1",
      // persist only durable data + sidebar; never persist auth/session/view (avoids SSR hydration mismatch + requires login each session)
      partialize: (s) => ({
        cases: s.cases,
        datasets: s.datasets,
        models: s.models,
        reports: s.reports,
        auditLogs: s.auditLogs,
        users: s.users,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      skipHydration: true,
    }
  )
);
// rehydrate on the client after mount
if (typeof window !== "undefined") {
  useAppStore.persist.rehydrate();
}

// helper selectors
export function useSelectedCase() {
  return useAppStore((s) => s.cases.find((c) => c.id === s.selectedCaseId) ?? null);
}
