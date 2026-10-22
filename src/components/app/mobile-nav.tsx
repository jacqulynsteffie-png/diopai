"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { NAV, MOBILE_PRIMARY_NAV, groupNav } from "./nav-config";
import { LogoMark } from "./logo";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function MobileNav() {
  const { view, setView, openNewCase, currentUser } = useAppStore();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const groups = React.useMemo(() => groupNav(), []);

  const primaryItems = MOBILE_PRIMARY_NAV.map(
    (id) => NAV.find((n) => n.id === id)!
  );

  function go(id: Parameters<typeof setView>[0]) {
    setView(id);
    setDrawerOpen(false);
  }

  return (
    <>
      {/* Bottom navigation bar */}
      <nav
        data-mobile-nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-glass glass lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary mobile navigation"
      >
        {primaryItems.map((item) => {
          const active = view === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                  active && "bg-brand-gradient-soft"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="truncate">{item.shortLabel}</span>
              {active && (
                <motion.span
                  layoutId="mobile-nav-active"
                  className="absolute -top-px h-0.5 w-8 rounded-full bg-brand-gradient"
                />
              )}
            </button>
          );
        })}
        {/* More button → opens drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
          aria-label="Open all navigation"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg">
            <Menu className="h-[18px] w-[18px]" />
          </span>
          <span>More</span>
        </button>
      </nav>

      {/* Slide-out drawer with all nav items */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-[#0B1220] text-slate-200 border-white/5">
          <SheetHeader className="border-b border-white/5 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-8 w-8" forceLight />
                <div className="leading-tight">
                  <SheetTitle className="text-[15px] font-semibold text-white">
                    Diop AI<span className="text-brand-gradient"> Research</span>
                  </SheetTitle>
                  <SheetDescription className="text-[10px] text-slate-400">
                    AI Dental Research
                  </SheetDescription>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100%-64px)]">
            {/* New case */}
            <div className="p-2.5">
              <button
                onClick={() => { openNewCase(); setDrawerOpen(false); }}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                <Sparkles className="h-[18px] w-[18px] text-cyan-300" />
                <span>New Research Case</span>
              </button>
            </div>

            {/* Nav groups */}
            <nav className="flex-1 overflow-y-auto scrollbar-medical px-2.5 pb-2">
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="mb-4">
                  <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const active = view === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => go(item.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            active
                              ? "bg-brand-gradient text-white"
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {active && <ChevronRight className="ml-auto h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Profile */}
            <div className="border-t border-white/5 p-2.5">
              <button
                onClick={() => go("settings")}
                className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                  {currentUser.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="truncate text-sm font-medium text-white">{currentUser.name}</p>
                  <p className="truncate text-[11px] text-slate-400">{currentUser.role}</p>
                </div>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
