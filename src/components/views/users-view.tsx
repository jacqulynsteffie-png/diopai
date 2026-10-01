"use client";

import * as React from "react";
import { Users as UsersIcon, UserPlus, ShieldCheck, MoreHorizontal } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function UsersView() {
  const { users, currentUser } = useAppStore();
  const isAdmin = currentUser.role === "Admin";

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          <ShieldCheck className="h-3.5 w-3.5" /> User management is restricted to administrators.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Users" value={users.length} />
        <Stat label="Admins" value={users.filter(u => u.role === "Admin").length} />
        <Stat label="Researchers" value={users.filter(u => u.role === "Researcher").length} />
        <Stat label="Active" value={users.filter(u => u.status === "Active").length} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary" /> Authorized Personnel</CardTitle>
            <CardDescription>Research team members</CardDescription>
          </div>
          <Button size="sm" className="bg-brand-gradient text-white"><UserPlus className="h-4 w-4" /> Add User</Button>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto scrollbar-medical">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Last Login</th>
                  <th className="px-3 py-2.5 font-medium">Created</th>
                  <th className="px-6 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 hover:bg-muted/40">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
                          {u.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                        </div>
                        <span className="text-sm font-medium text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{u.email}</td>
                    <td className="px-3 py-3"><Badge variant="outline" className={cn("text-[10px]", u.role === "Admin" ? "border-primary/30 text-primary" : "")}>{u.role}</Badge></td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", u.status === "Active" ? "text-emerald-600" : "text-amber-600")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", u.status === "Active" ? "bg-emerald-500" : "bg-amber-500")} />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{u.lastLogin?.slice(0, 10) ?? "—"}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{u.createdAt.slice(0, 10)}</td>
                    <td className="px-6 py-3 text-right">
                      <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground ml-auto"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">Roles are limited to Admin and Researcher. No unnecessary roles are created.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </CardContent></Card>
  );
}
