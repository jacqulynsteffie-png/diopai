"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ClipboardCheck,
  ScanLine,
  Activity,
  Target,
  ListChecks,
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  Brain,
  Lock,
  X,
  Info,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { STUDY_META, RESEARCH_PROTOCOL_TBD } from "@/lib/types";
import type {
  BoneQualityType,
  CbctFeatures,
  ClinicalFeatures,
  EligibilityStatus,
  ImplantSite,
  OutcomeClass,
  OutcomeRecord,
  ResearchCase,
  Sex,
} from "@/lib/types";
import { pseudoPredict } from "@/lib/demo-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 0, title: "Case Information", icon: User, desc: "De-identified case identifiers" },
  { id: 1, title: "Eligibility", icon: ClipboardCheck, desc: "Study inclusion criteria" },
  { id: 2, title: "CBCT Features", icon: ScanLine, desc: "Preoperative CBCT-derived" },
  { id: 3, title: "Clinical Data", icon: Activity, desc: "Approved research variables" },
  { id: 4, title: "Outcome", icon: Target, desc: "Documented outcome" },
  { id: 5, title: "Review", icon: ListChecks, desc: "Confirm & save" },
];

const SITES: ImplantSite[] = [
  "Maxilla Anterior", "Maxilla Premolar", "Maxilla Molar",
  "Mandible Anterior", "Mandible Premolar", "Mandible Molar",
];
const SEXES: Sex[] = ["Male", "Female"];
const BONE_TYPES: BoneQualityType[] = ["Type I", "Type II", "Type III", "Type IV"];

interface Draft {
  caseId: string;
  age: number | "";
  sex: Sex | "";
  implantSite: ImplantSite | "";
  toothPosition: string;
  cbctAvailable: boolean;
  cbctQuality: string;
  eligibility: Record<string, boolean>;
  cbct: Partial<CbctFeatures>;
  clinical: Partial<ClinicalFeatures>;
  outcome: Partial<OutcomeRecord>;
}

const defaultDraft: Draft = {
  caseId: `RC-${Math.floor(1000 + Math.random() * 9000)}`,
  age: "",
  sex: "",
  implantSite: "",
  toothPosition: "",
  cbctAvailable: true,
  cbctQuality: "Adequate",
  eligibility: {
    "Age within approved study range": false,
    "Preoperative CBCT available": true,
    "CBCT image quality adequate": false,
    "Implant site adequately visualized": false,
    "Clinical records complete": false,
    "Documented implant outcome available": false,
    "Adequate follow-up available": false,
  },
  cbct: {
    imageQualityScore: 4,
    boneDensityHu: 700,
    boneQuality: "Type II",
    buccolingualWidth: 6,
    apicocoronalHeight: 11,
    corticalBoneThickness: 1.5,
    sinusFloorToCrest: null,
    distanceToIA: null,
    buccalPlateThickness: 1.2,
    interradicularBone: null,
    source: "Manual entry",
    assessmentStatus: "Entered",
  },
  clinical: {
    smokingStatus: "Non-smoker",
    diabetesStatus: "None",
    bruxism: false,
    implantSystem: "",
    implantDiameterMm: 4.0,
    implantLengthMm: 11,
    loadingProtocol: "Conventional",
    prostheticType: "Crown",
    augmentationPerformed: false,
    additionalVariables: [],
  },
  outcome: {
    documentedOutcome: null,
    followUpMonths: null,
    assessmentDate: null,
    classificationSource: "Research protocol definition (configurable)",
    notes: "",
  },
};

export function NewCaseWizard() {
  const { newCaseOpen, closeNewCase, addCase, currentUser, addAuditLog, setView, setSelectedCase } = useAppStore();
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft>(defaultDraft);
  const [saving, setSaving] = React.useState(false);

  function reset() {
    setDraft({ ...defaultDraft, caseId: `RC-${Math.floor(1000 + Math.random() * 9000)}` });
    setStep(0);
  }

  function close() {
    closeNewCase();
    setTimeout(reset, 200);
  }

  function update(patch: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }
  function updateCbct(patch: Partial<CbctFeatures>) {
    setDraft((d) => ({ ...d, cbct: { ...d.cbct, ...patch } }));
  }
  function updateClinical(patch: Partial<ClinicalFeatures>) {
    setDraft((d) => ({ ...d, clinical: { ...d.clinical, ...patch } }));
  }
  function updateOutcome(patch: Partial<OutcomeRecord>) {
    setDraft((d) => ({ ...d, outcome: { ...d.outcome, ...patch } }));
  }

  const checksPassed = Object.values(draft.eligibility).filter(Boolean).length;
  const eligibility: EligibilityStatus = checksPassed >= 6 ? "Eligible" : checksPassed >= 4 ? "Requires Review" : "Excluded";

  function next() { setStep((s) => Math.min(STEPS.length - 1, s + 1)); }
  function prev() { setStep((s) => Math.max(0, s - 1)); }

  function buildCase(): ResearchCase {
    const now = new Date().toISOString();
    const pred = pseudoPredict({
      boneDensityHu: (draft.cbct.boneDensityHu as number) ?? null,
      boneQuality: (draft.cbct.boneQuality as string) ?? null,
      corticalBoneThickness: (draft.cbct.corticalBoneThickness as number) ?? null,
      buccolingualWidth: (draft.cbct.buccolingualWidth as number) ?? null,
      apicocoronalHeight: (draft.cbct.apicocoronalHeight as number) ?? null,
      smoking: (draft.clinical.smokingStatus as string) ?? null,
      diabetes: (draft.clinical.diabetesStatus as string) ?? null,
      bruxism: draft.clinical.bruxism ?? null,
      implantLengthMm: (draft.clinical.implantLengthMm as number) ?? null,
      loadingProtocol: (draft.clinical.loadingProtocol as string) ?? null,
    });
    return {
      id: `case_${Date.now()}`,
      caseId: draft.caseId,
      age: Number(draft.age),
      sex: draft.sex as Sex,
      implantSite: draft.implantSite as ImplantSite,
      toothPosition: draft.toothPosition || "—",
      cbctAvailable: draft.cbctAvailable,
      cbctQuality: draft.cbctQuality as ResearchCase["cbctQuality"],
      eligibility,
      eligibilityChecks: draft.eligibility,
      cbct: { ...(draft.cbct as CbctFeatures) },
      clinical: { ...(draft.clinical as ClinicalFeatures) },
      outcome: draft.outcome.documentedOutcome ? (draft.outcome as OutcomeRecord) : null,
      prediction: null,
      status: "Active",
      createdBy: currentUser.name,
      createdAt: now,
      updatedAt: now,
    };
  }

  function save(runPrediction = false) {
    setSaving(true);
    setTimeout(() => {
      const c = buildCase();
      if (runPrediction) {
        const pred = pseudoPredict({
          boneDensityHu: c.cbct.boneDensityHu,
          boneQuality: c.cbct.boneQuality,
          corticalBoneThickness: c.cbct.corticalBoneThickness,
          buccolingualWidth: c.cbct.buccolingualWidth,
          apicocoronalHeight: c.cbct.apicocoronalHeight,
          smoking: c.clinical.smokingStatus,
          diabetes: c.clinical.diabetesStatus,
          bruxism: c.clinical.bruxism,
          implantLengthMm: c.clinical.implantLengthMm,
          loadingProtocol: c.clinical.loadingProtocol,
        });
        c.prediction = {
          modelId: "model_xgb_v1",
          modelVersion: "1.0",
          algorithm: "XGBoost",
          predictedOutcome: pred.predictedOutcome,
          probability: parseFloat(pred.probability.toFixed(3)),
          featureContributions: pred.contributions,
          shapAvailable: true,
          generatedAt: new Date().toISOString(),
          status: "Completed",
        };
      }
      addCase(c);
      addAuditLog({
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action: "Created research case" + (runPrediction ? " + generated prediction" : ""),
        module: "Research Cases",
        caseId: c.caseId,
        status: "Success",
        detail: `Created ${c.caseId} (${c.eligibility}).`,
      });
      setSaving(false);
      close();
      toast({
        title: runPrediction ? "Research case saved & prediction generated" : "Research case saved",
        description: `${c.caseId} · ${eligibility}`,
      });
      setSelectedCase(c.id);
      setView(runPrediction ? "prediction" : "cases");
    }, 800);
  }

  return (
    <Dialog open={newCaseOpen} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-h-[100dvh] w-[calc(100%-1rem)] max-w-4xl sm:max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-2xl [&>button]:right-3 [&>button]:top-3">
        {/* Header / step indicator */}
        <div className="relative border-b border-border bg-brand-gradient-soft px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base">New Research Case</DialogTitle>
              <DialogDescription className="text-xs">
                Create a de-identified retrospective research case.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-1 overflow-x-auto scrollbar-medical">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors",
                        active ? "bg-brand-gradient text-white" : done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <span>{String(s.id + 1).padStart(2, "0")}</span>}
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <p className={cn("text-[11px] font-medium leading-tight", active ? "text-foreground" : "text-muted-foreground")}>{s.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight truncate">{s.desc}</p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <div className={cn("mx-1 h-px w-6 sm:w-8", done ? "bg-emerald-400" : "bg-border")} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-medical px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
            >
              {step === 0 && <Step1 draft={draft} update={update} />}
              {step === 1 && <Step2 draft={draft} update={update} eligibility={eligibility} checksPassed={checksPassed} />}
              {step === 2 && <Step3 draft={draft} updateCbct={updateCbct} />}
              {step === 3 && <Step4 draft={draft} updateClinical={updateClinical} />}
              {step === 4 && <Step5 draft={draft} updateOutcome={updateOutcome} />}
              {step === 5 && <Step6 draft={draft} eligibility={eligibility} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            {step === STEPS.length - 1 ? (
              <>
                <Button size="sm" variant="outline" onClick={() => save(true)} disabled={saving}>
                  <Brain className="h-4 w-4" /> Run AI Prediction
                </Button>
                <Button size="sm" className="bg-brand-gradient text-white" onClick={() => save(false)} disabled={saving}>
                  {saving ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Saving…</> : <><Save className="h-4 w-4" /> Save Research Case</>}
                </Button>
              </>
            ) : (
              <Button size="sm" className="bg-brand-gradient text-white" onClick={next}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Step components ----

function Step1({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-brand-gradient-soft px-3 py-2 text-xs text-primary">
        <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>Research data must remain de-identified. Do not enter patient names, MRNs, or other direct identifiers.</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Research Case ID" hint="De-identified study identifier">
          <Input value={draft.caseId} onChange={(e) => update({ caseId: e.target.value })} className="font-mono" />
        </Field>
        <Field label="Age (years)" hint="Age at implant placement">
          <Input
            type="number"
            value={draft.age}
            onChange={(e) => update({ age: e.target.value === "" ? "" : Number(e.target.value) })}
            placeholder="e.g. 45"
          />
        </Field>
        <Field label="Sex" hint="Biological sex (configurable)">
          <Select value={draft.sex || ""} onValueChange={(v) => update({ sex: v as Sex })}>
            <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
            <SelectContent>
              {SEXES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Implant Site" hint="Anatomical region">
          <Select value={draft.implantSite || ""} onValueChange={(v) => update({ implantSite: v as ImplantSite })}>
            <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
            <SelectContent>
              {SITES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Tooth Position (optional)" hint="FDI notation — configurable">
          <Input value={draft.toothPosition} onChange={(e) => update({ toothPosition: e.target.value })} placeholder="e.g. #25" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CBCT Available" hint="Preoperative CBCT acquired">
            <RadioGroup value={draft.cbctAvailable ? "yes" : "no"} onValueChange={(v) => update({ cbctAvailable: v === "yes" })} className="flex h-9 items-center gap-4">
              <div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="cbct-y" /><Label htmlFor="cbct-y" className="text-xs">Yes</Label></div>
              <div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="cbct-n" /><Label htmlFor="cbct-n" className="text-xs">No</Label></div>
            </RadioGroup>
          </Field>
          <Field label="CBCT Quality" hint="Image quality assessment">
            <Select value={draft.cbctQuality} onValueChange={(v) => update({ cbctQuality: v })} disabled={!draft.cbctAvailable}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Excellent", "Adequate", "Suboptimal"].map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </div>
  );
}

function Step2({ draft, update, eligibility, checksPassed }: { draft: Draft; update: (p: Partial<Draft>) => void; eligibility: EligibilityStatus; checksPassed: number }) {
  const items = Object.keys(draft.eligibility);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Eligibility assessment</p>
          <p className="text-sm font-semibold text-foreground">{checksPassed}/{items.length} criteria met</p>
        </div>
        <Badge className={cn(eligibility === "Eligible" ? "bg-emerald-100 text-emerald-700" : eligibility === "Requires Review" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600")}>
          {eligibility}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        The eligibility criteria follow the approved research protocol. Each criterion must be reviewed against source records.
      </p>
      <div className="space-y-2">
        {items.map((k) => (
          <label key={k} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/40">
            <Checkbox
              checked={draft.eligibility[k]}
              onCheckedChange={(v) => update({ eligibility: { ...draft.eligibility, [k]: !!v } })}
            />
            <span className="text-sm text-foreground">{k}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Step3({ draft, updateCbct }: { draft: Draft; updateCbct: (p: Partial<CbctFeatures>) => void }) {
  const c = draft.cbct;
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        CBCT-derived feature entry. Image upload and preview are available in the CBCT Features view. Do not claim automated segmentation unless implemented.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Bone Assessment">
          <Field label="Buccolingual Width" unit="mm"><Input type="number" step="0.1" value={c.buccolingualWidth ?? ""} onChange={(e) => updateCbct({ buccolingualWidth: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Apicocoronal Height" unit="mm"><Input type="number" step="0.1" value={c.apicocoronalHeight ?? ""} onChange={(e) => updateCbct({ apicocoronalHeight: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Cortical Bone Thickness" unit="mm"><Input type="number" step="0.1" value={c.corticalBoneThickness ?? ""} onChange={(e) => updateCbct({ corticalBoneThickness: e.target.value ? Number(e.target.value) : null })} /></Field>
        </SectionCard>
        <SectionCard title="Bone Density">
          <Field label="Bone Density (HU)" unit="Hounsfield Units" hint="Configurable threshold"><Input type="number" value={c.boneDensityHu ?? ""} onChange={(e) => updateCbct({ boneDensityHu: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Buccal Plate Thickness" unit="mm"><Input type="number" step="0.1" value={c.buccalPlateThickness ?? ""} onChange={(e) => updateCbct({ buccalPlateThickness: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Interradicular Bone" unit="mm (optional)"><Input type="number" step="0.1" value={c.interradicularBone ?? ""} onChange={(e) => updateCbct({ interradicularBone: e.target.value ? Number(e.target.value) : null })} /></Field>
        </SectionCard>
        <SectionCard title="Bone Quality">
          <Field label="Bone Quality Type" hint="Lekholm & Zarb classification (configurable)">
            <Select value={c.boneQuality ?? ""} onValueChange={(v) => updateCbct({ boneQuality: v as BoneQualityType })}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{BONE_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </SectionCard>
        <SectionCard title="Anatomical Assessment">
          <Field label="Sinus Floor to Crest" unit="mm (maxilla)" hint="Nullable when not applicable"><Input type="number" step="0.1" value={c.sinusFloorToCrest ?? ""} onChange={(e) => updateCbct({ sinusFloorToCrest: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Distance to Inferior Alveolar" unit="mm (mandible)" hint="Nullable when not applicable"><Input type="number" step="0.1" value={c.distanceToIA ?? ""} onChange={(e) => updateCbct({ distanceToIA: e.target.value ? Number(e.target.value) : null })} /></Field>
        </SectionCard>
        <SectionCard title="Image Quality" className="md:col-span-2">
          <Field label="Image Quality Score" unit="1–5 (configurable)"><Input type="number" min={1} max={5} value={c.imageQualityScore ?? ""} onChange={(e) => updateCbct({ imageQualityScore: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Assessment Status">
            <Select value={c.assessmentStatus ?? "Pending"} onValueChange={(v) => updateCbct({ assessmentStatus: v as CbctFeatures["assessmentStatus"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Entered", "Pending", "Partial"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Source"><Input value={c.source ?? "Manual entry"} onChange={(e) => updateCbct({ source: e.target.value })} /></Field>
        </SectionCard>
      </div>
    </div>
  );
}

function Step4({ draft, updateClinical }: { draft: Draft; updateClinical: (p: Partial<ClinicalFeatures>) => void }) {
  const cl = draft.clinical;
  return (
    <div className="space-y-5">
      <SectionCard title="General Clinical Information">
        <Field label="Smoking Status">
          <Select value={cl.smokingStatus ?? ""} onValueChange={(v) => updateClinical({ smokingStatus: v as ClinicalFeatures["smokingStatus"] })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{["Non-smoker", "Former smoker", "Current smoker"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Diabetes Status">
          <Select value={cl.diabetesStatus ?? ""} onValueChange={(v) => updateClinical({ diabetesStatus: v as ClinicalFeatures["diabetesStatus"] })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{["None", "Controlled", "Uncontrolled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Bruxism">
          <RadioGroup value={cl.bruxism ? "yes" : "no"} onValueChange={(v) => updateClinical({ bruxism: v === "yes" })} className="flex h-9 items-center gap-4">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="br-y" /><Label htmlFor="br-y" className="text-xs">Yes</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="br-n" /><Label htmlFor="br-n" className="text-xs">No</Label></div>
          </RadioGroup>
        </Field>
      </SectionCard>
      <SectionCard title="Implant-Related Variables">
        <Field label="Implant System" hint="Configurable research variable"><Input value={cl.implantSystem ?? ""} onChange={(e) => updateClinical({ implantSystem: e.target.value })} placeholder="e.g. System A" /></Field>
        <Field label="Diameter" unit="mm"><Input type="number" step="0.1" value={cl.implantDiameterMm ?? ""} onChange={(e) => updateClinical({ implantDiameterMm: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Length" unit="mm"><Input type="number" step="0.1" value={cl.implantLengthMm ?? ""} onChange={(e) => updateClinical({ implantLengthMm: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Loading Protocol">
          <Select value={cl.loadingProtocol ?? ""} onValueChange={(v) => updateClinical({ loadingProtocol: v as ClinicalFeatures["loadingProtocol"] })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{["Immediate", "Early", "Conventional"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Prosthetic Type">
          <Select value={cl.prostheticType ?? ""} onValueChange={(v) => updateClinical({ prostheticType: v as ClinicalFeatures["prostheticType"] })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{["Crown", "Bridge", "Overdenture"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Augmentation Performed">
          <RadioGroup value={cl.augmentationPerformed ? "yes" : "no"} onValueChange={(v) => updateClinical({ augmentationPerformed: v === "yes" })} className="flex h-9 items-center gap-4">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="aug-y" /><Label htmlFor="aug-y" className="text-xs">Yes</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="aug-n" /><Label htmlFor="aug-n" className="text-xs">No</Label></div>
          </RadioGroup>
        </Field>
      </SectionCard>
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        <Info className="h-3.5 w-3.5" />
        <span>Other approved research variables are configurable in Research Configuration. {RESEARCH_PROTOCOL_TBD} for protocol-specific fields.</span>
      </div>
    </div>
  );
}

function Step5({ draft, updateOutcome }: { draft: Draft; updateOutcome: (p: Partial<OutcomeRecord>) => void }) {
  const o = draft.outcome;
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-brand-gradient-soft px-3 py-2 text-xs text-primary">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>The exact outcome definition must come from the research protocol. Do not invent the definition of implant success/failure.</span>
      </div>
      <SectionCard title="Documented Outcome">
        <Field label="Outcome Classification" hint="Research protocol definition (configurable)">
          <Select value={o.documentedOutcome ?? ""} onValueChange={(v) => updateOutcome({ documentedOutcome: v === "none" ? null : (v as OutcomeClass) })}>
            <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No documented outcome</SelectItem>
              <SelectItem value="Success">Success</SelectItem>
              <SelectItem value="Failure">Failure</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Follow-up Duration" unit="months"><Input type="number" value={o.followUpMonths ?? ""} onChange={(e) => updateOutcome({ followUpMonths: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Assessment Date"><Input type="date" value={o.assessmentDate?.slice(0, 10) ?? ""} onChange={(e) => updateOutcome({ assessmentDate: e.target.value ? new Date(e.target.value).toISOString() : null })} /></Field>
      </SectionCard>
      <Field label="Notes" hint="Optional context — no identifying details">
        <Textarea value={o.notes ?? ""} onChange={(e) => updateOutcome({ notes: e.target.value })} rows={3} placeholder="Additional context…" />
      </Field>
      <p className="text-[11px] text-muted-foreground">Classification source: {o.classificationSource}</p>
    </div>
  );
}

function Step6({ draft, eligibility }: { draft: Draft; eligibility: EligibilityStatus }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ReviewCard title="Case Information" icon={User}>
          <Row k="Case ID" v={draft.caseId} mono />
          <Row k="Age" v={String(draft.age)} />
          <Row k="Sex" v={draft.sex || "—"} />
          <Row k="Implant Site" v={draft.implantSite || "—"} />
          <Row k="CBCT" v={draft.cbctAvailable ? `Yes · ${draft.cbctQuality}` : "No"} />
        </ReviewCard>
        <ReviewCard title="Eligibility" icon={ClipboardCheck}>
          <Row k="Status" v={eligibility} />
          <Row k="Criteria met" v={`${Object.values(draft.eligibility).filter(Boolean).length}/${Object.keys(draft.eligibility).length}`} />
        </ReviewCard>
        <ReviewCard title="CBCT Features" icon={ScanLine}>
          <Row k="Bone Density" v={`${draft.cbct.boneDensityHu ?? "—"} HU`} />
          <Row k="Bone Quality" v={draft.cbct.boneQuality ?? "—"} />
          <Row k="Buccolingual Width" v={`${draft.cbct.buccolingualWidth ?? "—"} mm`} />
          <Row k="Cortical Thickness" v={`${draft.cbct.corticalBoneThickness ?? "—"} mm`} />
        </ReviewCard>
        <ReviewCard title="Clinical Data" icon={Activity}>
          <Row k="Smoking" v={draft.clinical.smokingStatus ?? "—"} />
          <Row k="Diabetes" v={draft.clinical.diabetesStatus ?? "—"} />
          <Row k="Implant" v={draft.clinical.implantSystem || "—"} />
          <Row k="Loading" v={draft.clinical.loadingProtocol ?? "—"} />
        </ReviewCard>
        <ReviewCard title="Outcome" icon={Target}>
          <Row k="Documented Outcome" v={draft.outcome.documentedOutcome ?? "—"} />
          <Row k="Follow-up" v={`${draft.outcome.followUpMonths ?? "—"} months`} />
          <Row k="Assessment Date" v={draft.outcome.assessmentDate?.slice(0, 10) ?? "—"} />
        </ReviewCard>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        <Info className="h-3.5 w-3.5 mt-0.5" />
        <span>{STUDY_META.disclaimer}</span>
      </div>
    </div>
  );
}

// ---- shared ----

function Field({ label, children, hint, unit }: { label: string; children: React.ReactNode; hint?: string; unit?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-foreground">{label}</Label>
        {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
      </div>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full flex-col rounded-xl border border-border bg-card p-4", className)}>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">{children}</div>
    </div>
  );
}

function ReviewCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("font-medium text-foreground", mono && "font-mono")}>{v}</span>
    </div>
  );
}
