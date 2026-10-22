"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AiCoreStage =
  | "idle"
  | "uploading"
  | "validating"
  | "verifying"
  | "analyzing"
  | "extracting"
  | "predicting"
  | "complete"
  | "failed";

interface AiProcessingCoreProps {
  stage: AiCoreStage;
  label?: string;
  sublabel?: string;
  steps?: string[];
  currentStepIndex?: number;
  compact?: boolean;
  className?: string;
}

const STAGE_LABELS: Record<AiCoreStage, { label: string; sub: string }> = {
  idle: { label: "Awaiting input", sub: "Ready for CBCT dataset" },
  uploading: { label: "Uploading dataset", sub: "Transferring file" },
  validating: { label: "Validating structure", sub: "DICOM / volume integrity" },
  verifying: { label: "Verifying image", sub: "CBCT scan verification" },
  analyzing: { label: "Analyzing quality", sub: "AI image quality assessment" },
  extracting: { label: "Extracting features", sub: "AI feature extraction" },
  predicting: { label: "Generating prediction", sub: "ML outcome model" },
  complete: { label: "Complete", sub: "Processing finished" },
  failed: { label: "Processing failed", sub: "Recovery required" },
};

export function AiProcessingCore({
  stage,
  label,
  sublabel,
  steps,
  currentStepIndex = 0,
  compact = false,
  className,
}: AiProcessingCoreProps) {
  const active = label ?? STAGE_LABELS[stage].label;
  const sub = sublabel ?? STAGE_LABELS[stage].sub;
  const size = compact ? 150 : 220;
  const isProcessing = ["uploading", "validating", "verifying", "analyzing", "extracting", "predicting"].includes(stage);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-[#0B1220] px-6 py-8 text-white", className)}>
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      <div className="absolute inset-0 bg-radial-glow" />

      {/* floating neural particles */}
      {isProcessing &&
        Array.from({ length: compact ? 8 : 16 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-400/60"
            style={{ left: `${(i * 37 + 10) % 100}%`, top: `${(i * 53 + 5) % 100}%` }}
            animate={{ y: [0, -16, 0], opacity: [0.1, 0.85, 0.1] }}
            transition={{ duration: 2.4 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}

      <div className="relative flex flex-col items-center gap-5">
        {/* Central AI core */}
        <div className="relative grid place-items-center" style={{ width: size, height: size }}>
          {/* expanding scan rings */}
          {isProcessing && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-400/25"
                animate={{ scale: [1, 1.28, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-4 rounded-full border-2 border-blue-400/25"
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />
            </>
          )}

          {/* rotating radar sweep */}
          {isProcessing && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(6,182,212,0.4) 80deg, transparent 130deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* dashed orbit */}
          {isProcessing && (
            <motion.div
              className="absolute inset-6 rounded-full border border-dashed border-cyan-300/25"
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* data points converging to core (extracting/predicting) */}
          {(stage === "extracting" || stage === "predicting") &&
            Array.from({ length: 6 }).map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const r = size * 0.42;
              return (
                <motion.span
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-cyan-300"
                  style={{ left: "50%", top: "50%" }}
                  animate={{
                    x: [Math.cos(angle) * r, 0],
                    y: [Math.sin(angle) * r, 0],
                    opacity: [0.9, 0],
                    scale: [1, 0.3],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: "easeIn",
                  }}
                />
              );
            })}

          {/* scanning beam (verifying/analyzing) */}
          {(stage === "verifying" || stage === "analyzing") && (
            <div className="absolute inset-2 overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-x-0 h-16"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, rgba(6,182,212,0.55), transparent)",
                  boxShadow: "0 0 20px rgba(6,182,212,0.6)",
                }}
                animate={{ top: ["-20%", "120%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          )}

          {/* pulsing core */}
          <motion.div
            className="relative grid place-items-center rounded-full bg-brand-gradient shadow-[0_0_40px_-6px_rgba(37,99,235,0.7)]"
            style={{ width: size * 0.42, height: size * 0.42 }}
            animate={{
              scale: isProcessing ? [1, 1.08, 1] : 1,
              opacity: stage === "failed" ? 0.5 : 1,
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* neural nodes around core */}
            {isProcessing &&
              [0, 90, 180, 270].map((deg, i) => (
                <motion.span
                  key={deg}
                  className="absolute h-2 w-2 rounded-full bg-white"
                  style={{ transform: `rotate(${deg}deg) translateY(-${size * 0.24}px)` }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
                />
              ))}
            <AnimatePresence mode="wait">
              {stage === "complete" ? (
                <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </motion.div>
              ) : stage === "failed" ? (
                <AlertTriangle className="h-8 w-8 text-white" key="fail" />
              ) : stage === "uploading" ? (
                <Loader2 className="h-8 w-8 animate-spin text-white" key="up" />
              ) : (
                <Brain className="h-8 w-8 text-white drop-shadow" key="brain" />
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* status text */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-base font-semibold text-white"
            >
              {active}
            </motion.p>
          </AnimatePresence>
          <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
        </div>

        {/* step list */}
        {steps && steps.length > 0 && (
          <div className="w-full max-w-sm">
            <div className="relative mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-brand-gradient"
                animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-y-0 w-1/3 rounded-full bg-white/25 blur-sm"
                animate={{ left: ["-33%", "100%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2.5">
                  <div className="grid h-5 w-5 place-items-center">
                    {i < currentStepIndex ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </motion.span>
                    ) : i === currentStepIndex && isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      i < currentStepIndex
                        ? "text-slate-400 line-through"
                        : i === currentStepIndex
                        ? "font-medium text-white"
                        : "text-slate-500"
                    )}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
