"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  collapsed?: boolean;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true" role="img">
      <defs>
        <linearGradient id="diop-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.55" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="diop-tooth" x1="14" y1="10" x2="34" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#67E8F9" />
        </linearGradient>
        <radialGradient id="diop-glow" cx="50%" cy="42%" r="55%">
          <stop stopColor="#06B6D4" stopOpacity="0.45" />
          <stop offset="1" stopColor="#06B6D4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* rounded tile */}
      <rect x="1" y="1" width="46" height="46" rx="13" fill="#0B1220" />
      <rect x="1.5" y="1.5" width="45" height="45" rx="12.5" stroke="url(#diop-grad)" strokeOpacity="0.55" />
      {/* inner glow */}
      <rect x="3" y="3" width="42" height="42" rx="11" fill="url(#diop-glow)" opacity="0.6" />

      {/* Dental implant / tooth silhouette (incisor root form) */}
      <path
        d="M24 9.5c-3.6 0-6.2 2.2-7.4 5.4-0.9 2.4-0.8 4.6-0.4 7 0.5 3 1.4 5.6 1.8 8.6 0.3 2.2 0.4 4.6 1.2 6.4 0.6 1.4 1.7 2 2.8 1.6 1-0.4 1.4-1.4 1.6-2.8 0.2-1.8-0.2-3.8 0.2-5.6 0.3-1.4 1.2-1.8 2.2-1.6 1.1 0.2 1.6 1.2 1.8 2.6 0.3 1.9-0.1 4 0.3 5.8 0.3 1.4 0.9 2.4 2 2.6 1.2 0.2 2.2-0.6 2.7-2.1 0.7-2 0.9-4.5 1.3-6.8 0.5-3 1.4-5.6 1.8-8.6 0.4-2.4 0.4-4.6-0.6-7C31 11.7 28.1 9.5 24 9.5Z"
        fill="url(#diop-tooth)"
        opacity="0.95"
      />
      {/* tooth outline accent */}
      <path
        d="M24 9.5c-3.6 0-6.2 2.2-7.4 5.4-0.9 2.4-0.8 4.6-0.4 7 0.5 3 1.4 5.6 1.8 8.6"
        stroke="#06B6D4"
        strokeWidth="0.6"
        strokeOpacity="0.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* AI neural network inside the tooth */}
      <g stroke="url(#diop-grad)" strokeWidth="0.9" strokeOpacity="0.7">
        <line x1="20.5" y1="17" x2="24" y2="21.5" />
        <line x1="27.5" y1="17" x2="24" y2="21.5" />
        <line x1="24" y1="21.5" x2="21" y2="26" />
        <line x1="24" y1="21.5" x2="27" y2="26" />
        <line x1="21" y1="26" x2="27" y2="26" />
      </g>
      <g fill="#FFFFFF">
        <circle cx="20.5" cy="17" r="1.4" />
        <circle cx="27.5" cy="17" r="1.4" />
        <circle cx="24" cy="21.5" r="1.7" fill="#06B6D4" />
        <circle cx="21" cy="26" r="1.3" />
        <circle cx="27" cy="26" r="1.3" />
      </g>

      {/* base platform line (implant collar / research base) */}
      <path d="M13 39.5h22" stroke="url(#diop-grad)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="13" cy="39.5" r="1.3" fill="#2563EB" />
      <circle cx="35" cy="39.5" r="1.3" fill="#0F766E" />
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
            Diop AI<span className="text-brand-gradient"> Research</span>
          </span>
          <span className="text-[10.5px] text-slate-400 font-medium">
            AI Dental Research
          </span>
        </div>
      )}
    </div>
  );
}
