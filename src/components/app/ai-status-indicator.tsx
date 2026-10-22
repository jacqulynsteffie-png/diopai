"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Brain, Cpu, Activity, Info, ChevronDown } from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AiStatus = "ready" | "processing" | "model_unavailable" | "validation_required";

export function AiStatusIndicator() {
  const { models } = useAppStore();
  const activeModel = models.find((m) => m.algorithm === "XGBoost") ?? models[0];
  const status: AiStatus = "ready";

  const cfg: Record<AiStatus, { label: string; color: string; dot: string; pulse?: boolean }> = {
    ready: { label: "Ready", color: "text-emerald-600", dot: "bg-emerald-500" },
    processing: { label: "Processing", color: "text-cyan-600", dot: "bg-cyan-500", pulse: true },
    model_unavailable: { label: "Model unavailable", color: "text-red-500", dot: "bg-red-500" },
    validation_required: { label: "Validation required", color: "text-amber-600", dot: "bg-amber-500" },
  };
  const c = cfg[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <Brain className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">AI STATUS</span>
          <span className="relative flex h-1.5 w-1.5">
            {c.pulse && <motion.span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "currentColor" }} animate={{ scale: [1, 2.2], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />}
            <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", c.dot)} />
          </span>
          <span className={cn("hidden font-semibold sm:inline", c.color)}>{c.label}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-primary" /> AI System Status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-2 px-2 py-2 text-xs">
          <Row label="Overall status" value={<Badge className={cn("bg-cyan-100 text-cyan-700", c.color)}>{c.label}</Badge>} />
          <Row label="Environment" value="Production" />
          <DropdownMenuSeparator />
          <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Connected models</p>
          <ModelRow icon={ScanLine2} name="Image Verification" status="Research pipeline" available />
          <ModelRow icon={ScanLine2} name="Image Quality" status="Research pipeline" available />
          <ModelRow icon={Brain} name="Feature Extraction" status="Research pipeline" available />
          <ModelRow icon={Cpu} name="Outcome Prediction" status={`${activeModel?.algorithm ?? "—"} v${activeModel?.version ?? "—"}`} available />
        </div>
        <DropdownMenuSeparator />
        <div className="space-y-1 px-2 py-1.5 text-[10px] text-muted-foreground">
          <Row label="Model version" value={`${activeModel?.version ?? "—"}`} />
          <Row label="Last loaded" value={activeModel?.trainedAt?.slice(0, 10) ?? "—"} />
          <Row label="Available features" value={activeModel?.featureList.length ?? 0} />
          <Row label="Environment" value="Research" />
        </div>
        <DropdownMenuSeparator />
        <div className="flex items-start gap-1.5 px-3 py-2 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span>Research-use predictions only. Does not replace professional clinical assessment.</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ScanLine2(props: { className?: string }) {
  // local alias to avoid extra import collision
  return <Activity {...props} />;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function ModelRow({ icon: Icon, name, status, available }: { icon: React.ComponentType<{ className?: string }>; name: string; status: string; available: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-foreground">{name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{status}</p>
      </div>
      <span className={cn("h-1.5 w-1.5 rounded-full", available ? "bg-cyan-500" : "bg-red-500")} />
    </div>
  );
}
