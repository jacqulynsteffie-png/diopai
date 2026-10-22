"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-red-500/20 text-red-400 grid place-items-center text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-white">Application Error</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error?.message || "A critical error occurred while initializing the application."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => reset()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              Reload Application
            </button>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Hard Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
