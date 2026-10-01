"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Logo } from "./logo";
import { NAV, groupNav } from "./nav-config";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const { view, setView, sidebarCollapsed, toggleSidebar, currentUser, openNewCase } =
    useAppStore();
  const collapsed = sidebarCollapsed;
  const groups = React.useMemo(() => groupNav(), []);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 76 : 264 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="relative z-30 hidden h-screen flex-col border-r border-white/5 bg-[#0B1220] text-slate-200 shrink-0 lg:flex"
      >
        {/* Header */}
        <div className="flex h-16 items-center px-4 border-b border-white/5">
          <div className="flex items-center w-full justify-between">
            <Logo collapsed={collapsed} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-medical py-3 px-2.5">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-4">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = view === item.id;
                  const Icon = item.icon;
                  const inner = (
                    <button
                      onClick={() => setView(item.id)}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-gradient text-white shadow-[0_8px_24px_-10px_rgba(37,99,235,0.7)]"
                          : "text-slate-400 hover:text-white hover:bg-white/5",
                        collapsed && "justify-center"
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "drop-shadow")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {active && !collapsed && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90" />
                      )}
                    </button>
                  );
                  return collapsed ? (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{inner}</TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-900 border-white/10">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <React.Fragment key={item.id}>{inner}</React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Quick: New Case */}
        <div className="px-2.5 pb-2.5">
          <button
            onClick={openNewCase}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10",
              collapsed && "justify-center"
            )}
          >
            <Sparkles className="h-[18px] w-[18px] text-cyan-300" />
            {!collapsed && <span>New Research Case</span>}
          </button>
        </div>

        {/* Profile */}
        <div className="border-t border-white/5 p-2.5">
          <button
            onClick={() => setView("settings")}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5",
              collapsed && "justify-center"
            )}
          >
            <div className="relative h-9 w-9 shrink-0 rounded-full bg-brand-gradient grid place-items-center text-xs font-bold text-white">
              {currentUser.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            {!collapsed && (
              <div className="flex-1 text-left min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {currentUser.name}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {currentUser.role}
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-[#0B1220] text-slate-300 shadow-md transition-colors hover:bg-white/10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </motion.aside>
    </TooltipProvider>
  );
}

// Re-export for convenience
export { NAV };
