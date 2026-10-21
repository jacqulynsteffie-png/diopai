# Data Dictionary — Diop AI Research

All variables are **de-identified**. Fields not defined in the approved research protocol are marked *"To be defined in research protocol"* (TBD) and are configurable in Research Configuration.

## Research case

| Variable | Type | Unit | Description |
|----------|------|------|-------------|
| `case_id` | string | — | De-identified research case identifier (e.g. `RC-1234`) |
| `age` | integer | years | Age at implant placement |
| `sex` | category | — | Biological sex (configurable) |
| `implant_site` | category | — | Anatomical region (Maxilla/Mandible × Anterior/Premolar/Molar) |
| `tooth_position` | string | — | FDI notation (configurable, optional) |
| `cbct_available` | boolean | — | Preoperative CBCT acquired |
| `cbct_quality` | category | — | Excellent / Adequate / Suboptimal |
| `eligibility` | category | — | Eligible / Requires Review / Excluded |
| `status` | category | — | Draft / Active / Archived |

## CBCT-derived features

| Variable | Type | Unit | Description |
|----------|------|------|-------------|
| `image_quality_score` | integer | 1–5 (configurable) | Image quality assessment |
| `bone_density_hu` | number | Hounsfield Units | Bone density at implant site (threshold TBD in protocol) |
| `bone_quality` | category | — | Lekholm & Zarb Type I–IV (configurable) |
| `buccolingual_width` | number | mm | Buccolingual ridge width |
| `apicocoronal_height` | number | mm | Available bone height |
| `cortical_bone_thickness` | number | mm | Buccal cortical plate thickness |
| `sinus_floor_to_crest` | number | mm (maxilla) | Nullable when not applicable |
| `distance_to_ia` | number | mm (mandible) | Distance to inferior alveolar canal. Nullable when not applicable |
| `buccal_plate_thickness` | number | mm | Buccal plate thickness |
| `interradicular_bone` | number | mm (optional) | When adjacent teeth present |
| `source` | string | — | "Manual entry" or configurable source |
| `assessment_status` | category | — | Entered / Pending / Partial |

> Automated segmentation is **not** implemented. Feature entry is manual.

## Clinical features

| Variable | Type | Description |
|----------|------|-------------|
| `smoking_status` | category | Non-smoker / Former smoker / Current smoker |
| `diabetes_status` | category | None / Controlled / Uncontrolled |
| `bruxism` | boolean | Bruxism present |
| `implant_system` | string | Configurable research variable (brand) |
| `implant_diameter_mm` | number | Implant diameter |
| `implant_length_mm` | number | Implant length |
| `loading_protocol` | category | Immediate / Early / Conventional |
| `prosthetic_type` | category | Crown / Bridge / Overdenture |
| `augmentation_performed` | boolean | Augmentation performed |
| `additional_variables` | list | Configurable research variables (TBD in protocol) |

## Outcome

| Variable | Type | Description |
|----------|------|-------------|
| `documented_outcome` | category | Success / Failure — **definition from research protocol only** |
| `follow_up_months` | integer | Follow-up duration |
| `assessment_date` | date | Outcome assessment date |
| `classification_source` | string | "Research protocol definition (configurable)" |
| `notes` | string | Optional context — no identifying details |

## Prediction

| Variable | Type | Description |
|----------|------|-------------|
| `model_id` | string | Model registry identifier |
| `model_version` | string | Semantic version |
| `algorithm` | category | Logistic Regression / Random Forest / XGBoost |
| `predicted_outcome` | category | Success / Failure |
| `probability` | number | 0–1 |
| `feature_contributions` | list | Feature + contribution (research-use, not causation) |
| `shap_available` | boolean | SHAP values available where supported |
| `generated_at` | timestamp | Generation time |

---

**Disclaimer:** This data dictionary is for a research platform. It does not define clinical thresholds, outcome definitions, or CBCT measurements beyond what the approved research protocol specifies.
