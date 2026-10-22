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
  loginMode: "research" | "consultation";
  currentUser: { name: string; role: "Admin" | "Researcher"; email: string };
  login: (
    user?: { name: string; role: "Admin" | "Researcher"; email: string },
    targetView?: ViewId,
    mode?: "research" | "consultation"
  ) => void;
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
  deletedCaseIds: string[];
  addCase: (c: ResearchCase) => void;
  updateCase: (id: string, patch: Partial<ResearchCase>) => void;
  deleteCase: (id: string) => boolean;
  deleteCases: (ids: string[]) => boolean;
  models: ModelVersion[];
  addModel: (m: ModelVersion) => void;
  updateModel: (id: string, patch: Partial<ModelVersion>) => void;
  deleteModel: (id: string) => boolean;
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
            initialized: true,
            cases: s.cases,
            deletedCaseIds: s.deletedCaseIds,
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
  loginMode: "research",
  currentUser: {
    name: "Dr. A. Researcher",
    role: "Admin",
    email: "a.researcher@diop-ai.research",
  },
  login: (user, targetView = "dashboard", mode = "research") => {
    set({
      authenticated: true,
      loginMode: mode,
      currentUser: user || {
        name: mode === "consultation" ? "Dr. S. Implantologist" : "Dr. A. Researcher",
        role: "Admin",
        email: mode === "consultation" ? "implant.specialist@diop-ai.clinic" : "a.researcher@diop-ai.research",
      },
      view: targetView,
    });
    // hydrate durable cloud state (so data added or deleted on another device is immediately visible)
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

        // Combined set of all deleted cases (from local and cloud)
        const mergedDeleted = Array.from(
          new Set([...(cur.deletedCaseIds || []), ...(st.deletedCaseIds || [])])
        );
        const deletedSet = new Set(mergedDeleted);

        let finalCases: ResearchCase[] = [];
        if (Array.isArray(st.cases)) {
          // Canonical cloud state: if cloud says cases is empty (or has items), respect it directly!
          finalCases = st.cases.filter((c: ResearchCase) => !deletedSet.has(c.id));
        } else if (Array.isArray(cur.cases)) {
          finalCases = cur.cases.filter((c: ResearchCase) => !deletedSet.has(c.id));
        }

        set({
          cases: finalCases,
          deletedCaseIds: mergedDeleted,
          datasets: Array.isArray(st.datasets) ? st.datasets : cur.datasets,
          models: Array.isArray(st.models) ? st.models : cur.models,
          reports: Array.isArray(st.reports) ? st.reports : cur.reports,
          auditLogs: Array.isArray(st.auditLogs) && st.auditLogs.length > 0 ? st.auditLogs : cur.auditLogs,
          users: Array.isArray(st.users) && st.users.length > 0 ? st.users : cur.users,
        });
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

  deletedCaseIds: [],
  cases: generateDemoCases(128),
  addCase: (c) => {
    set((s) => ({
      cases: [c, ...s.cases.filter((existing) => existing.id !== c.id)],
      deletedCaseIds: (s.deletedCaseIds || []).filter((id) => id !== c.id),
    }));
    persistToDb(true);
  },
  updateCase: (id, patch) => {
    set((s) => ({
      cases: s.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
    persistToDb(true);
  },
  deleteCase: (id) => {
    const user = get().currentUser;
    if (user?.role !== "Admin") {
      return false;
    }
    const targetCase = get().cases.find((c) => c.id === id);
    const nextDeleted = Array.from(new Set([...(get().deletedCaseIds || []), id]));
    set((s) => ({
      cases: s.cases.filter((c) => c.id !== id),
      deletedCaseIds: nextDeleted,
      selectedCaseId: s.selectedCaseId === id ? null : s.selectedCaseId,
    }));
    get().addAuditLog({
      timestamp: new Date().toISOString(),
      user: user.name,
      action: "Deleted research case",
      module: "Cases",
      caseId: targetCase?.caseId || id,
      status: "Warning",
      detail: `Research case ${targetCase?.caseId || id} was deleted by Admin ${user.name}.`,
    });
    persistToDb(true);
    return true;
  },
  deleteCases: (ids) => {
    const user = get().currentUser;
    if (user?.role !== "Admin") {
      return false;
    }
    const idSet = new Set(ids);
    const targetCases = get().cases.filter((c) => idSet.has(c.id));
    const nextDeleted = Array.from(new Set([...(get().deletedCaseIds || []), ...ids]));
    set((s) => ({
      cases: s.cases.filter((c) => !idSet.has(c.id)),
      deletedCaseIds: nextDeleted,
      selectedCaseId: s.selectedCaseId && idSet.has(s.selectedCaseId) ? null : s.selectedCaseId,
    }));
    get().addAuditLog({
      timestamp: new Date().toISOString(),
      user: user.name,
      action: `Bulk deleted ${ids.length} research cases`,
      module: "Cases",
      caseId: targetCases.map((c) => c.caseId).join(", "),
      status: "Warning",
      detail: `Batch deletion of ${ids.length} case(s) (${targetCases.map((c) => c.caseId).slice(0, 5).join(", ")}${targetCases.length > 5 ? "..." : ""}) by Admin ${user.name}.`,
    });
    persistToDb(true);
    return true;
  },

  models: generateDemoModels(),
  addModel: (m) => { set((s) => ({ models: [m, ...s.models] })); persistToDb(true); },
  updateModel: (id, patch) => {
    set((s) => ({
      models: s.models.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
    const user = get().currentUser;
    get().addAuditLog({
      timestamp: new Date().toISOString(),
      user: user?.name || "System",
      action: "Updated model configuration",
      module: "Models",
      caseId: id,
      status: "Success",
      detail: `Model ${id} was updated.`,
    });
    persistToDb(true);
  },
  deleteModel: (id) => {
    const user = get().currentUser;
    const target = get().models.find((m) => m.id === id);
    set((s) => ({
      models: s.models.filter((m) => m.id !== id),
    }));
    get().addAuditLog({
      timestamp: new Date().toISOString(),
      user: user?.name || "System",
      action: "Deleted model from registry",
      module: "Models",
      caseId: id,
      status: "Warning",
      detail: `Model ${target?.algorithm ?? ""} ${target?.version ?? ""} (${id}) was deleted by ${user?.name || "Admin"}.`,
    });
    persistToDb(true);
    return true;
  },
  clearResearchData: () => {
    const cur = get();
    const allIds = cur.cases.map((c) => c.id);
    const nextDeleted = Array.from(new Set([...(cur.deletedCaseIds || []), ...allIds]));
    set({
      cases: [],
      deletedCaseIds: nextDeleted,
      datasets: [],
      models: [],
      reports: [],
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: cur.currentUser?.name || "System",
          action: "Cleared all research data",
          module: "System",
          caseId: null,
          status: "Warning",
          detail: "All cases, datasets, models and reports cleared by Admin.",
        },
      ],
    });
    persistToDb(true);
  },
  resetDemoData: () => {
    set({
      cases: generateDemoCases(128),
      deletedCaseIds: [],
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
    persistToDb(true);
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
        deletedCaseIds: s.deletedCaseIds,
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
