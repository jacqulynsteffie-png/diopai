# Model Card — ImplantAI Research

> Research-use only. Metrics shown are **synthetic demo values**. Not validated clinical performance.

## Model details

- **Model ID:** `model_xgb_v1`
- **Version:** `1.0`
- **Algorithm:** XGBoost (gradient-boosted trees)
- **Status:** Validated (demo)
- **Training dataset:** `dataset_v1` — 128 synthetic records (de-identified)
- **Feature list:**
  1. Bone Density (HU)
  2. Bone Quality
  3. Cortical Bone Thickness
  4. Buccolingual Width
  5. Apicocoronal Height
  6. Smoking Status
  7. Diabetes Status
  8. Bruxism
  9. Implant Length
  10. Loading Protocol
- **Validation strategy:** 5-fold stratified cross-validation (research protocol configurable)
- **Trained at:** see model registry (demo timestamp)
- **File location:** `/models/model_xgb_v1.joblib` (demo path — not a real serialized model)

## Intended use

- **Intended users:** Dental researchers, oral & maxillofacial surgery researchers, faculty.
- **Intended use:** Retrospective research evaluation of a predictive model for dental implant outcomes based on preoperative CBCT-derived features.
- **Out-of-scope:** Clinical diagnosis, treatment recommendation, regulatory claims, individual patient decision-making.

## Metrics (synthetic — DEMO)

| Metric | Value (demo) |
|--------|--------------|
| Accuracy | 0.81 |
| Sensitivity | 0.78 |
| Specificity | 0.83 |
| Precision | 0.76 |
| F1 | 0.77 |
| ROC-AUC | 0.82 |

Confusion matrix (demo): TP 62, FP 13, FN 17, TN 63.

> Do **not** interpret these as validated clinical performance. Replace with metrics from the actual trained model once available.

## Training data

De-identified, retrospective, synthetic demo data. Eligibility per research protocol (age 18–80, preoperative CBCT, adequate quality, documented outcome, adequate follow-up).

## Evaluation data

Held-out folds from 5-fold stratified cross-validation (demo).

## Data leakage prevention

- Only preoperative (prediction-time) features are used.
- Documented future outcomes are **never** used as input features.

## Ethical considerations

- De-identified research data only.
- No patient-identifying fields collected.
- Feature importance is **not** causation.
- Outcome definition comes from the research protocol, not the model.

## Limitations

- Synthetic demo data does not represent real cohort characteristics.
- The deployed predictor is a deterministic pseudo-scoring function mimicking an XGBoost output, not a real trained model. Swap with a real joblib model in `/api/predict` for production research.
- Calibration and external validation required before any non-research claim.

## Caveats & recommendations

- Use only for research evaluation under the approved IRB protocol.
- A model must not be labelled "best" without an explicitly defined selection criterion in the research protocol.
