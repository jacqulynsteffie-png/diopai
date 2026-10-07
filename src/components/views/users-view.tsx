"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users as UsersIcon, UserPlus, ShieldCheck, MoreHorizontal, Check, X, UserCog, Trash2, Ban, Mail, Lock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { UserRecord, UserRole } from "@/lib/types";

export function UsersView() {
  const { users, currentUser, addUser, updateUser, removeUser, addAuditLog } = useAppStore();
  const { toast } = useToast();
  const isAdmin = currentUser.role === "Admin";
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          <ShieldCheck className="h-3.5 w-3.5" /> User management is restricted to administrators. Changes are audit-logged.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Users" value={users.length} />
        <Stat label="Admins" value={users.filter((u) => u.role === "Admin").length} />
        <Stat label="Researchers" value={users.filter((u) => u.role === "Researcher").length} />
        <Stat label="Active" value={users.filter((u) => u.status === "Active").length} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary" /> Authorized Personnel</CardTitle>
            <CardDescription>Research team members</CardDescription>
          </div>
          <Button size="sm" className="bg-brand-gradient text-white" onClick={() => setOpen(true)} disabled={!isAdmin}>
            <UserPlus className="h-4 w-4" /> Add User
          </Button>
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
                {users.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">No users yet. Add your first authorized research member.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
                            {u.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">{u.name}</span>
                            {u.email === currentUser.email && <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>}
                          </div>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground ml-auto" aria-label="User actions" disabled={!isAdmin}>
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>{u.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              updateUser(u.id, { status: u.status === "Active" ? "Suspended" : "Active" });
                              addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: u.status === "Active" ? "Suspended user" : "Activated user", module: "Users", caseId: null, status: "Success", detail: u.email });
                              toast({ title: u.status === "Active" ? "User suspended" : "User activated", description: u.name });
                            }}>
                              {u.status === "Active" ? <><Ban className="mr-2 h-4 w-4" /> Suspend</> : <><Check className="mr-2 h-4 w-4" /> Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const role = u.role === "Admin" ? "Researcher" : "Admin";
                              updateUser(u.id, { role });
                              addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "Changed user role", module: "Users", caseId: null, status: "Success", detail: `${u.email} → ${role}` });
                              toast({ title: "Role updated", description: `${u.name} is now ${role}` });
                            }}>
                              <UserCog className="mr-2 h-4 w-4" /> Toggle role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={u.email === currentUser.email}
                              onClick={() => {
                                removeUser(u.id);
                                addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "Removed user", module: "Users", caseId: null, status: "Success", detail: u.email });
                                toast({ title: "User removed", description: u.name });
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">Roles are limited to Admin and Researcher. No unnecessary roles are created. All changes are audit-logged.</p>

      <AddUserDialog open={open} onClose={() => setOpen(false)} onAdd={(u) => {
        addUser(u);
        addAuditLog({ timestamp: new Date().toISOString(), user: currentUser.name, action: "Created user", module: "Users", caseId: null, status: "Success", detail: `${u.email} (${u.role})` });
        toast({ title: "User added", description: `${u.name} (${u.role}) created.` });
      }} />
    </div>
  );
}

function AddUserDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (u: UserRecord) => void }) {
  const { users } = useAppStore();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("Researcher");
  const [status, setStatus] = React.useState<"Active" | "Suspended">("Active");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});

  function reset() {
    setName(""); setEmail(""); setRole("Researcher"); setStatus("Active"); setErrors({});
  }

  function submit() {
    const e: { name?: string; email?: string } = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
    else if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) e.email = "A user with this email already exists";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    onAdd({
      id: `u_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      status,
      lastLogin: null,
      createdAt: new Date().toISOString(),
    });
    onClose();
    setTimeout(reset, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setTimeout(reset, 200); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Add Authorized User</DialogTitle>
          <DialogDescription>Create a new research team member. All access is audit-logged.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Full name</Label>
            <Input id="u-name" value={name} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }} placeholder="Dr. Jane Researcher" className={cn(errors.name && "border-destructive")} />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="u-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }} placeholder="researcher@implant-ai.research" className={cn("pl-9", errors.email && "border-destructive")} />
            </div>
            {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Researcher">Researcher</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Initial status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "Active" | "Suspended")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>New users receive access credentials via a secure out-of-band channel. This platform does not display passwords.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { onClose(); setTimeout(reset, 200); }}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button className="bg-brand-gradient text-white" onClick={submit}>
            <Check className="h-4 w-4" /> Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
