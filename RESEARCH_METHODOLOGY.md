# Research Methodology — ImplantAI Research

> Evaluation of an Artificial Intelligence-Based Predictive Model for Dental Implant Outcomes Based on Preoperative CBCT-Derived Features: A Retrospective Study.

## Study design

Retrospective study using de-identified, pre-existing records. This is a research platform, not a clinical diagnostic system.

## Objective

Evaluate an AI-based predictive model for dental implant outcomes based on preoperative CBCT-derived features.

> The exact primary/secondary endpoints and outcome definitions are defined in the approved IRB research protocol. The platform marks unspecified fields as *"To be defined in research protocol"* and exposes them as configurable settings (Research Configuration).

## Inclusion / exclusion criteria (per protocol)

Inclusion checks applied at case creation:
1. Age within approved study range (default 18–80, configurable)
2. Preoperative CBCT available
3. CBCT image quality adequate
4. Implant site adequately visualized
5. Clinical records complete
6. Documented implant outcome available
7. Adequate follow-up available (default ≥ 6 months, configurable)

Cases meeting ≥ 6 criteria → **Eligible**; 4–5 → **Requires Review**; < 4 → **Excluded**.

## Data sources

- De-identified research case records (CSV/Excel import supported with validation).
- Preoperative CBCT-derived features (manual entry; automated segmentation **not** implemented).
- Clinical and outcome variables per protocol.

## Feature engineering

Features are limited to those available at the prediction (preoperative) time:
- CBCT-derived: bone density (HU), bone quality, cortical thickness, buccolingual width, apicocoronal height, anatomical distances.
- Clinical: smoking, diabetes, bruxism, implant dimensions, loading protocol, prosthetic type.

## Model training & evaluation

- Algorithms evaluated: Logistic Regression, Random Forest, XGBoost.
- Validation: 5-fold stratified cross-validation (configurable).
- Metrics: Accuracy, Sensitivity, Specificity, Precision, F1, ROC-AUC; plus confusion matrix, PR curve, calibration.
- Model registry: each model stores version, algorithm, training dataset version, feature list, training date, validation strategy, metrics, file location.
- Data leakage prevention: documented future outcomes are never used as inputs.

## Prediction API

Deterministic pseudo-scoring (mimics XGBoost probability) at `/api/predict`. Research-use only. Replace with a real trained model inference call for production research.

## Explainability

Feature contribution / SHAP where supported. Contributions indicate model reliance, **not** causation.

## Limitations

- Synthetic demo data does not represent real cohorts.
- Metrics shown in DEMO mode are synthetic.
- No clinical thresholds, outcome definitions, or CBCT measurements are invented beyond the approved protocol.
- Feature importance ≠ causation.
- The platform does not diagnose patients or recommend treatment.

## Research-use disclaimer

> This prediction is intended for research evaluation and does not replace professional clinical assessment or treatment planning.

## Ethics & privacy

- De-identified research data only.
- Audit logging on all research actions.
- Role-based authorization (Admin, Researcher).
- No casual modification of scientific definitions without appropriate permissions/audit logging.
