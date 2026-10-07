"use client";

import { create } from "zustand";
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

export const useAppStore = create<AppState>((set, get) => ({
  authenticated: false,
  currentUser: {
    name: "Dr. A. Researcher",
    role: "Admin",
    email: "a.researcher@implant-ai.research",
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

  cases: generateDemoCases(128),
  addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),
  updateCase: (id, patch) =>
    set((s) => ({
      cases: s.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  models: generateDemoModels(),
  addModel: (m) => set((s) => ({ models: [m, ...s.models] })),
  datasets: generateDemoDatasets(),
  addDataset: (d) => set((s) => ({ datasets: [d, ...s.datasets] })),
  auditLogs: generateDemoAuditLogs(40),
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
  reports: generateDemoReports(),
  addReport: (r) => set((s) => ({ reports: [r, ...s.reports] })),
  stats: DEMO_STATS,
}));

// helper selectors
export function useSelectedCase() {
  return useAppStore((s) => s.cases.find((c) => c.id === s.selectedCaseId) ?? null);
}
