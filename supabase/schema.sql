-- ====================================================================
-- Diop AI Research Platform — PostgreSQL Schema for Supabase
-- Retrospective dental implant outcome research platform.
-- ====================================================================

-- 1. Research Cases Table
CREATE TABLE IF NOT EXISTS public.research_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT UNIQUE NOT NULL,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  implant_site TEXT NOT NULL,
  tooth_position TEXT,
  cbct_available BOOLEAN DEFAULT true,
  cbct_quality TEXT DEFAULT 'Adequate',
  eligibility TEXT DEFAULT 'Requires Review',
  status TEXT DEFAULT 'Active',
  created_by TEXT NOT NULL DEFAULT 'researcher',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CBCT Features Table
CREATE TABLE IF NOT EXISTS public.cbct_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id_ref TEXT UNIQUE NOT NULL REFERENCES public.research_cases(case_id) ON DELETE CASCADE,
  image_quality_score INTEGER,
  bone_density_hu INTEGER,
  bone_quality TEXT,
  buccolingual_width NUMERIC,
  apicocoronal_height NUMERIC,
  cortical_bone_thickness NUMERIC,
  sinus_floor_to_crest NUMERIC,
  distance_to_ia NUMERIC,
  buccal_plate_thickness NUMERIC,
  interradicular_bone NUMERIC,
  source TEXT DEFAULT 'CBCT Preoperative Scan',
  assessment_status TEXT DEFAULT 'Verified',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clinical Features Table
CREATE TABLE IF NOT EXISTS public.clinical_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id_ref TEXT UNIQUE NOT NULL REFERENCES public.research_cases(case_id) ON DELETE CASCADE,
  smoking_status TEXT,
  diabetes_status TEXT,
  bruxism BOOLEAN,
  implant_system TEXT,
  implant_diameter_mm NUMERIC,
  implant_length_mm NUMERIC,
  loading_protocol TEXT,
  prosthetic_type TEXT,
  augmentation_performed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Outcomes Table
CREATE TABLE IF NOT EXISTS public.outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id_ref TEXT UNIQUE NOT NULL REFERENCES public.research_cases(case_id) ON DELETE CASCADE,
  documented_outcome TEXT,
  follow_up_months INTEGER,
  assessment_date TIMESTAMPTZ,
  classification_source TEXT DEFAULT 'Research protocol definition',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id_ref TEXT UNIQUE NOT NULL REFERENCES public.research_cases(case_id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  predicted_outcome TEXT NOT NULL,
  probability NUMERIC NOT NULL,
  shap_available BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Completed',
  feature_contributions JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Model Versions Table
CREATE TABLE IF NOT EXISTS public.model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT UNIQUE NOT NULL,
  version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  status TEXT DEFAULT 'Validated',
  training_dataset_version TEXT,
  feature_list JSONB,
  trained_at TIMESTAMPTZ,
  validation_strategy TEXT,
  roc_auc NUMERIC,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Datasets Table
CREATE TABLE IF NOT EXISTS public.dataset_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  records INTEGER NOT NULL,
  eligible INTEGER NOT NULL,
  excluded INTEGER NOT NULL,
  missing_values INTEGER DEFAULT 0,
  duplicates INTEGER DEFAULT 0,
  invalid_values INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 100,
  status TEXT DEFAULT 'Validated',
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  case_id TEXT,
  status TEXT DEFAULT 'Success',
  detail TEXT
);

-- 9. Durable App State Key-Value Table
CREATE TABLE IF NOT EXISTS public.app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_cases_case_id ON public.research_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_research_cases_eligibility ON public.research_cases(eligibility);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_predictions_model_id ON public.predictions(model_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.research_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbct_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Allow full access to authenticated service role
CREATE POLICY "Allow service role full access on research_cases" ON public.research_cases FOR ALL USING (true);
CREATE POLICY "Allow service role full access on cbct_features" ON public.cbct_features FOR ALL USING (true);
CREATE POLICY "Allow service role full access on clinical_features" ON public.clinical_features FOR ALL USING (true);
CREATE POLICY "Allow service role full access on outcomes" ON public.outcomes FOR ALL USING (true);
CREATE POLICY "Allow service role full access on predictions" ON public.predictions FOR ALL USING (true);
CREATE POLICY "Allow service role full access on model_versions" ON public.model_versions FOR ALL USING (true);
CREATE POLICY "Allow service role full access on dataset_records" ON public.dataset_records FOR ALL USING (true);
CREATE POLICY "Allow service role full access on audit_logs" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Allow service role full access on app_state" ON public.app_state FOR ALL USING (true);
