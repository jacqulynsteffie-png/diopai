"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  collapsed?: boolean;
}

// Square mark (tooth + implant icon) on a white rounded card — reads cleanly on dark surfaces.
// Used as the logo mark in collapsed sidebar, topbar (mobile), login, and as the favicon.
export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5", className)}>
      <img src="/logo-icon.png" alt="Diop AI" className="h-full w-full object-contain" />
    </div>
  );
}

// Full brand logo (icon + "DIOP AI" wordmark + tagline). The source logo has dark text on a
// light background, so it is rendered on a white rounded card to stay readable on dark surfaces.
export function Logo({ className, collapsed = false }: LogoProps) {
  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <LogoMark className="h-9 w-9" />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center overflow-hidden rounded-xl bg-white px-2 py-1 shadow-sm ring-1 ring-black/5">
        <img
          src="/logo-brand.png"
          alt="Diop AI — Dental Implant Prediction AI"
          className="h-7 w-auto max-w-[150px] object-contain"
        />
      </div>
    </div>
  );
}
