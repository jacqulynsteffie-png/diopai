"use client";

import * as React from "react";
import { User, Lock, Palette, Cpu, FlaskConical, BookOpen, Save, Moon, Sun, Info } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { STUDY_META, RESEARCH_PROTOCOL_TBD } from "@/lib/types";

export function SettingsView() {
  const { currentUser } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  return (
    <Tabs defaultValue="profile">
      <TabsList className="flex w-full flex-wrap gap-1 h-auto bg-muted/60 p-1">
        <TabsTrigger value="profile"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
        <TabsTrigger value="security"><Lock className="h-3.5 w-3.5" /> Security</TabsTrigger>
        <TabsTrigger value="appearance"><Palette className="h-3.5 w-3.5" /> Appearance</TabsTrigger>
        <TabsTrigger value="model"><Cpu className="h-3.5 w-3.5" /> Model</TabsTrigger>
        <TabsTrigger value="research"><FlaskConical className="h-3.5 w-3.5" /> Research</TabsTrigger>
        <TabsTrigger value="dictionary"><BookOpen className="h-3.5 w-3.5" /> Data Dictionary</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle><CardDescription>Your researcher profile</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Name</Label><Input defaultValue={currentUser.name} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={currentUser.email} /></div>
            <div className="space-y-1.5"><Label>Role</Label><Input defaultValue={currentUser.role} disabled /></div>
            <div className="space-y-1.5"><Label>Institution</Label><Input placeholder={STUDY_META.sponsor} /></div>
            <div className="sm:col-span-2"><Button className="bg-brand-gradient text-white" onClick={() => toast({ title: "Profile saved" })}><Save className="h-4 w-4" /> Save Changes</Button></div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader><CardTitle>Security</CardTitle><CardDescription>Authentication and session</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>New Password</Label><Input type="password" placeholder="••••••••" /></div>
              <div className="space-y-1.5"><Label>Confirm Password</Label><Input type="password" placeholder="••••••••" /></div>
            </div>
            <ToggleRow label="Two-factor authentication" desc="Require 2FA for research access" />
            <ToggleRow label="Session timeout (30 min)" desc="Auto sign-out after inactivity" defaultOn />
            <Button className="bg-brand-gradient text-white" onClick={() => toast({ title: "Security updated" })}><Save className="h-4 w-4" /> Update Security</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="appearance">
        <Card>
          <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Theme and display</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Theme</Label>
              <div className="flex gap-2">
                <ThemeOption label="Light" icon={Sun} active={theme === "light"} onClick={() => setTheme("light")} />
                <ThemeOption label="Dark" icon={Moon} active={theme === "dark"} onClick={() => setTheme("dark")} />
                <ThemeOption label="System" icon={Palette} active={theme === "system"} onClick={() => setTheme("system")} />
              </div>
            </div>
            <ToggleRow label="Reduced motion" desc="Minimize animations" />
            <ToggleRow label="High contrast" desc="Enhance readability" defaultOn />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="model">
        <Card>
          <CardHeader><CardTitle>Model Configuration</CardTitle><CardDescription>Prediction model settings</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Active Model</Label><Input defaultValue="XGBoost v1.0" /></div>
            <div className="space-y-1.5"><Label>Default Probability Threshold</Label><Input defaultValue="0.5" /></div>
            <div className="space-y-1.5"><Label>Model Registry Path</Label><Input defaultValue="/models/registry.json" disabled /></div>
            <div className="space-y-1.5"><Label>Cross-Validation Folds</Label><Input defaultValue="5" /></div>
            <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              <Info className="h-3.5 w-3.5 mt-0.5" /> Changes to active model require re-validation per research protocol.
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="research">
        <Card>
          <CardHeader><CardTitle>Research Configuration</CardTitle><CardDescription>Configurable research definitions (admin)</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Outcome Labels</Label>
              <Input defaultValue="Success, Failure" />
              <p className="text-[10px] text-muted-foreground">{RESEARCH_PROTOCOL_TBD} — exact outcome definition comes from research protocol.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Approved Variables</Label>
              <Textarea rows={3} defaultValue="Bone Density (HU), Bone Quality, Cortical Thickness, Smoking, Diabetes, Implant Length, Loading Protocol" />
            </div>
            <div className="space-y-1.5">
              <Label>Eligibility Rules</Label>
              <Textarea rows={3} defaultValue="Age 18-80; Preoperative CBCT available; CBCT quality adequate; Documented outcome available; Follow-up ≥ 6 months" />
            </div>
            <div className="space-y-1.5">
              <Label>Feature Definitions</Label>
              <Textarea rows={3} defaultValue="Bone Density: Hounsfield Units at implant site (configurable threshold). Bone Quality: Lekholm & Zarb Type I–IV." />
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              <Info className="h-3.5 w-3.5 mt-0.5" /> Scientific definitions must not be casually modified. Changes are audit-logged and require appropriate permissions.
            </div>
            <Button className="bg-brand-gradient text-white" onClick={() => toast({ title: "Research configuration saved" })}><Save className="h-4 w-4" /> Save Configuration</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="dictionary">
        <Card>
          <CardHeader><CardTitle>Data Dictionary</CardTitle><CardDescription>Research variable definitions</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {[
              ["case_id", "De-identified research case identifier", "string"],
              ["age", "Age at implant placement (years)", "integer"],
              ["sex", "Biological sex (configurable)", "category"],
              ["implant_site", "Anatomical region", "category"],
              ["bone_density_hu", "Bone density in Hounsfield Units", "number"],
              ["bone_quality", "Lekholm & Zarb bone quality type", "category"],
              ["cortical_thickness", "Cortical bone thickness (mm)", "number"],
              ["smoking_status", "Smoking classification", "category"],
              ["outcome", "Documented implant outcome", "category"],
              ["follow_up_months", "Follow-up duration (months)", "number"],
            ].map(([v, d, t]) => (
              <div key={v} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5">
                <span className="w-44 font-mono text-xs text-primary">{v}</span>
                <span className="flex-1 text-xs text-foreground">{d}</span>
                <Badge variant="outline" className="text-[10px]">{t}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = React.useState(!!defaultOn);
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}

function ThemeOption({ label, icon: Icon, active, onClick }: { label: string; icon: React.ComponentType<{ className?: string }>; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors", active ? "border-primary bg-brand-gradient-soft text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted")}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
