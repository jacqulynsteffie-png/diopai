"use client";

import * as React from "react";
import { ShieldCheck, Search, Filter } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function AuditView() {
  const { auditLogs } = useAppStore();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [module, setModule] = React.useState("all");

  const filtered = auditLogs.filter((l) => {
    if (query && !l.action.toLowerCase().includes(query.toLowerCase()) && !l.user.toLowerCase().includes(query.toLowerCase())) return false;
    if (status !== "all" && l.status !== status) return false;
    if (module !== "all" && l.module !== module) return false;
    return true;
  });

  const modules = Array.from(new Set(auditLogs.map((l) => l.module)));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search action or user…" className="h-9 pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="Success">Success</SelectItem>
              <SelectItem value="Warning">Warning</SelectItem>
              <SelectItem value="Error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setStatus("all"); setModule("all"); }}><Filter className="h-4 w-4" /> Reset</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          <div className="max-h-[70vh] overflow-y-auto scrollbar-medical">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-2.5 font-medium">Timestamp</th>
                  <th className="px-3 py-2.5 font-medium">User</th>
                  <th className="px-3 py-2.5 font-medium">Action</th>
                  <th className="px-3 py-2.5 font-medium">Case ID</th>
                  <th className="px-3 py-2.5 font-medium">Module</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-6 py-2.5 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">No audit entries match the filter.</td></tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="px-6 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-xs">{l.user}</td>
                      <td className="px-3 py-2.5 text-xs font-medium text-foreground">{l.action}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-primary">{l.caseId ?? "—"}</td>
                      <td className="px-3 py-2.5"><Badge variant="secondary" className="text-[10px]">{l.module}</Badge></td>
                      <td className="px-3 py-2.5">
                        <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium",
                          l.status === "Success" ? "text-emerald-600" : l.status === "Warning" ? "text-amber-600" : "text-red-500")}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", l.status === "Success" ? "bg-emerald-500" : l.status === "Warning" ? "bg-amber-500" : "bg-red-500")} />
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-2.5 text-xs text-muted-foreground">{l.detail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> All research activity is audit-logged and traceable. IP/device information is recorded where permitted.
      </p>
    </div>
  );
}
