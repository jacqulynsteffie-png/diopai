"use client";

import type { ComponentType } from "react";
import {
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
  Settings as SettingsIcon,
} from "lucide-react";
import type { ViewId } from "@/lib/types";

export interface NavItem {
  id: ViewId;
  label: string;
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
  group: string;
}

export const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, group: "Overview" },

  { id: "cases", label: "Research Cases", shortLabel: "Cases", icon: FolderSearch, group: "Research" },
  { id: "cbct-workspace", label: "CBCT AI Workspace", shortLabel: "CBCT AI", icon: ScanLine, group: "Research" },
  { id: "cbct", label: "CBCT Features", shortLabel: "Features", icon: ScanLine, group: "Research" },
  { id: "clinical", label: "Clinical Data", shortLabel: "Clinical", icon: Stethoscope, group: "Research" },
  { id: "outcomes", label: "Outcomes", shortLabel: "Outcomes", icon: Target, group: "Research" },

  { id: "prediction", label: "Predictions", shortLabel: "Predict", icon: Brain, group: "AI" },
  { id: "model-performance", label: "Model Performance", shortLabel: "Models", icon: Activity, group: "AI" },
  { id: "feature-analysis", label: "Feature Analysis", shortLabel: "Features", icon: BarChart3, group: "AI" },

  { id: "dataset", label: "Dataset", shortLabel: "Dataset", icon: Database, group: "Data" },
  { id: "reports", label: "Research Reports", shortLabel: "Reports", icon: FileText, group: "Data" },

  { id: "audit", label: "Audit Logs", shortLabel: "Audit", icon: ShieldCheck, group: "System" },
  { id: "users", label: "Users", shortLabel: "Users", icon: Users, group: "System" },
  { id: "settings", label: "Settings", shortLabel: "Settings", icon: SettingsIcon, group: "System" },
];

// Items shown in the mobile bottom navigation (primary destinations). Keep to 4 + the
// built-in "More" button = 5 total so labels never get cramped on small screens.
export const MOBILE_PRIMARY_NAV: ViewId[] = [
  "dashboard",
  "cases",
  "cbct-workspace",
  "prediction",
];

export function groupNav(): Record<string, NavItem[]> {
  const g: Record<string, NavItem[]> = {};
  for (const item of NAV) (g[item.group] ??= []).push(item);
  return g;
}
