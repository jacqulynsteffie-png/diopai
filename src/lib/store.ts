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
  hydrateFromDb: () => Promise<void>;
  syncToCloud: () => Promise<boolean>;
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
    (set, get) => {
      // Server-side cloud persistence (durable, cross-device via Supabase)
      let dbTimer: ReturnType<typeof setTimeout> | null = null;
      function persistToDb(immediate = false): Promise<boolean> {
        if (typeof window === "undefined") return Promise.resolve(false);
        if (dbTimer) clearTimeout(dbTimer);

        const execute = async (): Promise<boolean> => {
          const s = get();
          const state = {
            cases: s.cases,
            datasets: s.datasets,
            models: s.models,
            reports: s.reports,
            auditLogs: s.auditLogs,
            users: s.users,
          };
          try {
            const res = await fetch("/api/state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state }),
              keepalive: true,
            });
            const data = await res.json().catch(() => null);
            return data?.ok ?? false;
          } catch (e) {
            console.warn("Cloud state persist error:", e);
            return false;
          }
        };

        if (immediate) {
          return execute();
        } else {
          return new Promise<boolean>((resolve) => {
            dbTimer = setTimeout(async () => {
              const ok = await execute();
              resolve(ok);
            }, 150);
          });
        }
      }

      function merge<T extends { id: string }>(cloud: T[], local: T[]): { merged: T[]; hasNewLocal: boolean } {
        const out = [...cloud];
        let hasNewLocal = false;
        for (const x of local) {
          if (!out.some((y) => y.id === x.id)) {
            out.unshift(x);
            hasNewLocal = true;
          }
        }
        return { merged: out, hasNewLocal };
      }

      return {
  authenticated: false,
  currentUser: {
    name: "Dr. A. Researcher",
    role: "Admin",
    email: "a.researcher@diop-ai.research",
  },
  login: () => {
    set({ authenticated: true });
    // hydrate durable cloud state (so data added on another device is immediately visible)
    get().hydrateFromDb();
  },
  syncToCloud: async () => {
    return persistToDb(true);
  },
  hydrateFromDb: async () => {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = await res.json();
      if (data?.state) {
        const st = data.state;
        const cur = get();

        const casesRes = st.cases?.length ? merge(st.cases, cur.cases) : { merged: cur.cases, hasNewLocal: (cur.cases?.length || 0) > 0 };
        const datasetsRes = st.datasets?.length ? merge(st.datasets, cur.datasets) : { merged: cur.datasets, hasNewLocal: false };
        const modelsRes = st.models?.length ? merge(st.models, cur.models) : { merged: cur.models, hasNewLocal: false };
        const reportsRes = st.reports?.length ? merge(st.reports, cur.reports) : { merged: cur.reports, hasNewLocal: false };
        const auditLogsRes = st.auditLogs?.length ? merge(st.auditLogs, cur.auditLogs) : { merged: cur.auditLogs, hasNewLocal: false };
        const usersRes = st.users?.length ? merge(st.users, cur.users) : { merged: cur.users, hasNewLocal: false };

        set({
          cases: casesRes.merged,
          datasets: datasetsRes.merged,
          models: modelsRes.merged,
          reports: reportsRes.merged,
          auditLogs: auditLogsRes.merged,
          users: usersRes.merged,
        });

        // If local client had items that were not yet in the cloud database (e.g. 129th case added on Desktop),
        // immediately push to cloud so that all other devices (Mobile) will see the constant database state!
        if (casesRes.hasNewLocal || datasetsRes.hasNewLocal || modelsRes.hasNewLocal || reportsRes.hasNewLocal) {
          persistToDb(true);
        }
      }
    } catch {
      /* non-blocking */
    }
  },
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
  addCase: (c) => { set((s) => ({ cases: [c, ...s.cases] })); persistToDb(true); },
  updateCase: (id, patch) => {
    set((s) => ({
      cases: s.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
    persistToDb(true);
  },

  models: generateDemoModels(),
  addModel: (m) => { set((s) => ({ models: [m, ...s.models] })); persistToDb(); },
  clearResearchData: () => {
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
    });
    persistToDb();
  },
  resetDemoData: () => {
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
    });
    persistToDb();
  },
  datasets: generateDemoDatasets(),
  addDataset: (d) => { set((s) => ({ datasets: [d, ...s.datasets] })); persistToDb(); },
  auditLogs: [],
  addAuditLog: (l) => {
    set((s) => ({
      auditLogs: [
        { ...l, id: `log_${Date.now()}_${Math.floor(Math.random() * 999)}` },
        ...s.auditLogs,
      ],
    }));
    persistToDb();
  },
  users: generateDemoUsers(),
  addUser: (u) => { set((s) => ({ users: [u, ...s.users] })); persistToDb(); },
  updateUser: (id, patch) => { set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })); persistToDb(); },
  removeUser: (id) => { set((s) => ({ users: s.users.filter((u) => u.id !== id) })); persistToDb(); },
  reports: generateDemoReports(),
  addReport: (r) => { set((s) => ({ reports: [r, ...s.reports] })); persistToDb(); },
  stats: DEMO_STATS,
      };
    },
    {
      name: "diop-ai-research-v1",
      // persist only durable data + sidebar; never persist auth/session/view
      // (auth stays false on SSR + first client render → LoginView matches SSR → no hydration mismatch)
      partialize: (s) => ({
        cases: s.cases,
        datasets: s.datasets,
        models: s.models,
        reports: s.reports,
        auditLogs: s.auditLogs,
        users: s.users,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
);

// helper selectors
export function useSelectedCase() {
  return useAppStore((s) => s.cases.find((c) => c.id === s.selectedCaseId) ?? null);
}
