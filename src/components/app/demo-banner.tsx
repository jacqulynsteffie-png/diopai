"use client";

import { FlaskConical, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export function DemoBanner() {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <div className="relative flex items-center justify-center gap-2 bg-brand-gradient px-4 py-1.5 text-center text-[11px] font-medium text-white sm:text-xs">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong>DEMO MODE</strong> — Synthetic Research Data. Not real clinical results.
        Switch to Production Research Dataset via authenticated configuration.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"
        aria-label="Dismiss banner"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
