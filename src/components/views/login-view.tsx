"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Stethoscope,
  FolderSearch,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { STUDY_META } from "@/lib/types";
import { BrandLogo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type LoginMode = "research" | "consultation";

export function LoginView() {
  const { login, hydrateFromDb } = useAppStore();
  const { toast } = useToast();

  const [mode, setMode] = React.useState<LoginMode>("research");
  const [email, setEmail] = React.useState("a.researcher@diop-ai.research");
  const [password, setPassword] = React.useState("research");
  const [show, setShow] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    hydrateFromDb();
  }, [hydrateFromDb]);

  const handleModeSwitch = (newMode: LoginMode) => {
    setMode(newMode);
    if (newMode === "research") {
      setEmail("a.researcher@diop-ai.research");
      setPassword("research");
    } else {
      setEmail("implant.specialist@diop-ai.clinic");
      setPassword("clinical");
    }
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === "consultation") {
        login(
          {
            name: "Dr. S. Implantologist",
            role: "Admin",
            email,
          },
          "patient-consultation",
          "consultation"
        );
        toast({
          title: "Live Patient AI Consultation Active",
          description: "Authenticated as Clinical Specialist. Real-time patient intake enabled.",
        });
      } else {
        login(
          {
            name: "Dr. A. Researcher",
            role: "Admin",
            email,
          },
          "dashboard",
          "research"
        );
        toast({
          title: "Welcome to Diop AI Research Platform",
          description: "Authenticated as authorized research investigator.",
        });
      }
    }, 600);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* Left — Medical AI Neural Network Visualization (Desktop) */}
      <div className="relative hidden overflow-hidden bg-[#0B1220] lg:block">
        <div className="absolute inset-0 bg-grid-dark opacity-60" />
        <div className="absolute inset-0 bg-radial-glow" />
        {/* animated particles */}
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-400/60"
            style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%` }}
            animate={{ y: [0, -16, 0], opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        {/* Neural Network SVG */}
        <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 400 600" fill="none">
          <defs>
            <linearGradient id="net" x1="0" y1="0" x2="400" y2="600">
              <stop stopColor="#2563EB" stopOpacity="0.8" />
              <stop offset="1" stopColor="#06B6D4" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {[120, 240, 360, 480].map((y, li) =>
            [80, 160, 240, 320].map((x, ni) => (
              <g key={`${li}-${ni}`}>
                {li < 3 &&
                  [80, 160, 240, 320].map((x2, ni2) => (
                    <line
                      key={`${li}-${ni}-${ni2}`}
                      x1={x}
                      y1={y}
                      x2={x2}
                      y2={[240, 360, 480][li]}
                      stroke="url(#net)"
                      strokeWidth="0.5"
                      opacity="0.4"
                    />
                  ))}
                <circle cx={x} cy={y} r="4" fill="#06B6D4" opacity="0.7" />
              </g>
            ))
          )}
        </svg>

        {/* Brand Logo Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute right-10 top-1/2 -translate-y-1/2"
        >
          <img src="/logo-brand-light.png" alt="Diop AI" className="h-36 w-auto max-w-[320px] object-contain drop-shadow" />
        </motion.div>

        {/* Left Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center">
            <img src="/logo-brand-light.png" alt="Diop AI — Dental Implant Prediction AI" className="h-12 w-auto max-w-[240px] object-contain" />
          </div>

          <div className="max-w-md space-y-4">
            <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs px-3 py-1">
              Multi-Portal Clinical & Research Architecture
            </Badge>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-balance text-3xl font-semibold leading-tight text-white"
            >
              AI-Powered Dental Implant Outcomes on Preoperative CBCT-Derived Features.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-sm leading-relaxed text-slate-300"
            >
              Separate dedicated environments for <strong className="text-white">Retrospective Cohort Research</strong> and <strong className="text-cyan-300">Live Patient Clinical Intake & Feasibility Planning</strong>.
            </motion.p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Research Portal</span>
                <p className="mt-1 text-xs text-slate-200">129 De-identified retrospective cases, model validation & SHAP analysis.</p>
              </div>
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold">Live Patient AI</span>
                <p className="mt-1 text-xs text-slate-200">Natural text intake, implant possibility plan, and dataset enrollment.</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            {STUDY_META.design} · Clinical Decision Support & Model Training Framework.
          </p>
        </div>
      </div>

      {/* Right — Dual Login Form with Portal Switcher */}
      <div className="relative flex items-center justify-center bg-background px-4 py-8 sm:px-12 sm:py-12">
        <div className="absolute inset-0 bg-grid opacity-30 lg:hidden" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-md space-y-6"
        >
          {/* Prominent, Big Mobile Logo */}
          <div className="flex flex-col items-center sm:items-start gap-2 lg:hidden">
            <div className="flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-sm w-full sm:w-auto">
              <BrandLogo className="h-16 sm:h-20 w-auto max-w-[270px] sm:max-w-[320px] object-contain drop-shadow" />
            </div>
          </div>

          {/* Dedicated Login Portal Switcher Tabs */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Select Login Portal:
            </span>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/80 border border-border shadow-inner">
              <button
                type="button"
                onClick={() => handleModeSwitch("research")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all",
                  mode === "research"
                    ? "bg-background text-primary shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FolderSearch className="h-4 w-4" />
                <span>Research Platform</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("consultation")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all",
                  mode === "consultation"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Stethoscope className="h-4 w-4" />
                <span>Patient AI Consultation</span>
              </button>
            </div>
          </div>

          {/* Active Portal Header & Badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {mode === "consultation" ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-3 w-3" /> Live Patient AI Consultation Login
                  </span>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Patient Consultation Portal
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Dedicated sign-in for clinical specialists. Input real-person clinical notes, choose predictive models, assess surgical feasibility, and enroll cases into the training dataset.
                  </p>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-brand-gradient-soft px-3 py-1 text-[11px] font-semibold text-primary">
                    <ShieldCheck className="h-3 w-3" /> Research Investigator Access
                  </span>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Research Platform Login
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Authorized IRB investigator access to the retrospective study dataset, model performance benchmarking, CBCT feature extraction, and audit logs.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="email">
                {mode === "consultation" ? "Clinician Account / Email" : "Researcher Username / Email"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-9 text-xs"
                  placeholder={mode === "consultation" ? "implant.specialist@diop-ai.clinic" : "researcher@institution.edu"}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-9 pr-9 text-xs font-mono"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                Remember me
              </label>
              <button type="button" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "h-11 w-full text-white shadow-lg text-xs font-semibold gap-2 transition-all hover:opacity-95",
                mode === "consultation"
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-600/25"
                  : "bg-brand-gradient shadow-[0_10px_30px_-10px_rgba(37,99,235,0.7)]"
              )}
            >
              {loading ? (
                "Authenticating Portal…"
              ) : mode === "consultation" ? (
                <>
                  <Stethoscope className="h-4 w-4" /> Sign In to Live Patient Consultation
                </>
              ) : (
                <>
                  <FolderSearch className="h-4 w-4" /> Sign In to Research Platform
                </>
              )}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Quick Preset Selector for this portal */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-3 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>Active Environment:</span>
              <strong className="text-foreground">
                {mode === "consultation" ? "Live Patient Clinical Intake" : "Retrospective Research Study"}
              </strong>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {mode === "consultation"
                ? "Directly unlocks text note intake, multi-model feasibility planning & training dataset storage."
                : "Unlocks 129 research cases, CBCT workspace, model training, validation & audit logs."}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Authorized personnel only. All patient interactions and research access are audit-logged.</span>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Secure clinical & research access · Diop AI Research Platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}
