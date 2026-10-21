"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, ArrowRight, Activity, ScanLine } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { STUDY_META } from "@/lib/types";
import { BrandLogo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export function LoginView() {
  const { login } = useAppStore();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("a.researcher@diop-ai.research");
  const [password, setPassword] = React.useState("research");
  const [show, setShow] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login();
      toast({
        title: "Welcome to Diop AI Research",
        description: "Authenticated as authorized research personnel.",
      });
    }, 700);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — clean brand panel */}
      <div className="relative hidden overflow-hidden bg-[#0B1220] lg:block">
        {/* brand logo showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute right-10 top-1/2 -translate-y-1/2"
        >
          <img src="/logo-brand-light.png" alt="Diop AI" className="h-36 w-auto max-w-[320px] object-contain" />
        </motion.div>

        {/* content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center">
            <img src="/logo-brand-light.png" alt="Diop AI — Dental Implant Prediction AI" className="h-9 w-auto max-w-[180px] object-contain" />
          </div>
          <div className="max-w-md">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-balance text-3xl font-semibold leading-tight text-white"
            >
              AI-powered dental implant outcome research on preoperative CBCT-derived features.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-4 text-sm leading-relaxed text-slate-300"
            >
              A retrospective research platform for evaluating predictive models.
              De-identified study data, model versioning, scientific analytics,
              and auditable traceability.
            </motion.p>
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                { icon: ScanLine, label: "CBCT-derived features" },
                { icon: Activity, label: "Model evaluation" },
                { icon: ShieldCheck, label: "De-identified" },
              ].map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
                >
                  <b.icon className="h-3.5 w-3.5 text-cyan-300" />
                  {b.label}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {STUDY_META.design} · Research-use platform · Not a clinical diagnostic device.
          </p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="relative flex items-center justify-center bg-background px-6 py-12 sm:px-12">
        <div className="absolute inset-0 bg-grid opacity-30 lg:hidden" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandLogo className="h-8 w-auto max-w-[160px]" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-brand-gradient-soft px-3 py-1 text-[11px] font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Authorized research access
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Welcome to Diop AI Research
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Secure access to the AI-powered dental implant research platform.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="email">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-9"
                  placeholder="researcher@institution.edu"
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
                  className="h-11 pl-9 pr-9"
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
              className="h-11 w-full bg-brand-gradient text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.7)] hover:opacity-95"
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Authorized research personnel only. All access is audit-logged.</span>
          </div>
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Secure research access · Diop AI Research platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}
