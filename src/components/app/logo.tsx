"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  collapsed?: boolean;
}

// Square tooth+implant icon mark — theme-aware (dark icon on light theme, light icon on dark theme).
// Set `forceLight` to always use the light version (for surfaces that are always dark).
export function LogoMark({ className, forceLight = false }: { className?: string; forceLight?: boolean }) {
  if (forceLight) {
    return (
      <img
        src="/logo-icon-light.png"
        alt="Diop AI"
        className={cn("object-contain", className)}
      />
    );
  }
  return (
    <>
      <img
        src="/logo-icon.png"
        alt="Diop AI"
        className={cn("object-contain dark:hidden", className)}
      />
      <img
        src="/logo-icon-light.png"
        alt="Diop AI"
        className={cn("hidden object-contain dark:block", className)}
      />
    </>
  );
}

// Full brand logo — theme-aware (dark text on light theme, light text on dark theme),
// transparent background so it matches the surface. Used on theme-dependent surfaces.
export function BrandLogo({ className }: { className?: string }) {
  return (
    <>
      <img
        src="/logo-brand.png?v=2"
        alt="Diop AI — Dental Implant Prediction AI"
        className={cn("object-contain dark:hidden", className)}
      />
      <img
        src="/logo-brand-light.png?v=2"
        alt="Diop AI — Dental Implant Prediction AI"
        className={cn("hidden object-contain dark:block", className)}
      />
    </>
  );
}

// Sidebar logo — the sidebar is always dark navy, so this always uses the light version.
// Big, transparent, matching the background (no white card).
export function Logo({ className, collapsed = false }: LogoProps) {
  if (collapsed) {
    return (
      <img
        src="/logo-icon-light.png"
        alt="Diop AI"
        className={cn("h-9 w-9 object-contain", className)}
      />
    );
  }
  return (
    <img
      src="/logo-brand-light.png?v=2"
      alt="Diop AI — Dental Implant Prediction AI"
      className={cn("h-11 w-auto max-w-[210px] object-contain", className)}
    />
  );
}
