"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {error?.message || "An unexpected error occurred while loading this view."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          size="sm"
          className="gap-1.5 bg-brand-gradient text-white shadow-sm"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
        <Button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <Home className="h-4 w-4" /> Return to Login
        </Button>
      </div>
    </div>
  );
}
