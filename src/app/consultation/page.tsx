"use client";

import * as React from "react";
import { AppShell } from "@/components/app/app-shell";
import { useAppStore } from "@/lib/store";

export default function ConsultationPage() {
  const { setLoginMode, loginMode } = useAppStore();

  React.useEffect(() => {
    if (loginMode !== "consultation") {
      setLoginMode("consultation");
    }
  }, [setLoginMode, loginMode]);

  return <AppShell initialLoginMode="consultation" />;
}
