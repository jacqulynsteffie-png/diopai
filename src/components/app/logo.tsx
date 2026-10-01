"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  collapsed?: boolean;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ia-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* rounded tile */}
      <rect x="1" y="1" width="46" height="46" rx="13" fill="#0B1220" />
      <rect x="1.5" y="1.5" width="45" height="45" rx="12.5" stroke="url(#ia-grad)" strokeOpacity="0.5" />
      {/* dental implant silhouette */}
      <path
        d="M24 9c-3.2 0-5 2.4-5 5.4 0 1.5.5 2.7 1.2 4.2L24 26l3.8-7.4c.7-1.5 1.2-2.7 1.2-4.2C29 11.4 27.2 9 24 9Z"
        fill="url(#ia-grad)"
      />
      <path d="M24 26l-2.1 12.1c-.2 1.1.6 2.1 1.7 2.1h.8c1.1 0 1.9-1 1.7-2.1L24 26Z" fill="#06B6D4" />
      {/* AI network nodes */}
      <circle cx="13" cy="30" r="2.2" fill="#2563EB" />
      <circle cx="35" cy="30" r="2.2" fill="#06B6D4" />
      <circle cx="13" cy="38" r="1.8" fill="#0F766E" />
      <circle cx="35" cy="38" r="1.8" fill="#0F766E" />
      {/* connecting lines */}
      <path d="M24 30.5L13 30M24 30.5L35 30M24 38.2L13 38M24 38.2L35 38M13 30v8M35 30v8M24 30.5v7.7" stroke="url(#ia-grad)" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, showWordmark = true, collapsed = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative shrink-0">
        <LogoMark className="h-9 w-9" />
      </div>
      {showWordmark && !collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold tracking-tight text-white">
            ImplantAI<span className="text-brand-gradient"> Research</span>
          </span>
          <span className="text-[10.5px] text-slate-400 font-medium">
            AI Dental Research
          </span>
        </div>
      )}
    </div>
  );
}
