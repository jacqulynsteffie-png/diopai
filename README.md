# ImplantAI Research

**AI-Powered Dental Implant Outcome Research Platform**

> Evaluation of an Artificial Intelligence-Based Predictive Model for Dental Implant Outcomes Based on Preoperative CBCT-Derived Features: A Retrospective Study.

A retrospective **research** platform (not a patient-facing diagnostic system) for evaluating predictive models on de-identified, CBCT-derived dental implant data.

---

## ⚠️ Important — Research-use only

- This platform is a **research** tool. It does **not** diagnose patients, recommend treatment, or claim clinical validity.
- All metrics shown in DEMO mode are **synthetic** and do not represent real clinical performance.
- Outcome definitions, CBCT measurement thresholds, and clinical thresholds come **only** from the approved research protocol. Fields not specified are marked *"To be defined in research protocol"* and are configurable.
- Feature importance is **not** causation.
- Documented future outcomes are **never** used as prediction inputs.

A persistent **"DEMO MODE — Synthetic Research Data"** banner is shown whenever the synthetic data source is active.

---

## Tech stack

| Layer | Technology |
|------|------------|
| Framework | Next.js 16 (App Router), TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui (New York), Lucide icons |
| Charts | Recharts |
| Animation | Framer Motion |
| State | Zustand (client), TanStack Query (available) |
| DB | Prisma ORM (SQLite client) |
| Auth | NextAuth.js v4 (available) |
| AI | z-ai-web-dev-sdk (LLM research-summary endpoint) |

> The original spec mentions Vite + FastAPI + PostgreSQL. This deliverable adapts the architecture to the Next.js 16 full-stack environment (API routes + Prisma/SQLite) while preserving the same feature set and scientific constraints. The ML pipeline is represented by a deterministic, auditable pseudo-scoring function that mimics an XGBoost probability output; the codebase is structured so a real trained model can be swapped in at `/api/predict` without UI changes.

---

## Architecture

```
src/
  app/
    page.tsx              # Hosts the single-page AppShell (only user-facing route)
    layout.tsx            # Theme provider, fonts, toaster
    globals.css           # Medical-AI design system
    api/
      cases/route.ts      # GET/POST research cases (Prisma)
      predict/route.ts     # POST deterministic pseudo-ML prediction
      ai-summary/route.ts # POST LLM research-use narrative (z-ai-web-dev-sdk)
  components/
    app/                  # AppShell, Sidebar, Topbar, CommandPalette, DemoBanner, Logo
    views/               # Dashboard, Cases, NewCaseWizard, CBCT, Clinical, Outcomes,
                          # Prediction, ModelPerformance, FeatureAnalysis, Dataset,
                          # Reports, Audit, Users, Settings
    ui/                    # shadcn/ui component set
  lib/
    store.ts              # Zustand navigation + in-memory demo data
    types.ts              # Domain types, study metadata
    demo-data.ts          # Synthetic data generator (clearly marked)
    db.ts                 # Prisma client
prisma/
  schema.prisma           # users, research_cases, cbct_features, clinical_features,
                          # outcomes, predictions, model_versions, datasets, audit_logs
  seed.ts                 # Synthetic DB seed
```

State-driven SPA: the sidebar switches between views via Zustand (`view`), all on the `/` route.

---

## Installation

```bash
bun install
bun run db:push     # create/migrate SQLite schema
bun run db:seed     # load synthetic demo data
bun run dev         # http://localhost:3000
```

Demo login is pre-filled on the login screen.

---

## Environment

```
DATABASE_URL="file:/home/z/my-project/db/custom.db"
```

---

## API

| Method | Path | Description |
|-------|------|-------------|
| GET | `/api/cases` | List research cases (Prisma) |
| POST | `/api/cases` | Create a de-identified research case |
| POST | `/api/predict` | Pseudo-ML prediction (deterministic, no future outcomes) |
| POST | `/api/ai-summary` | LLM research-use narrative (constrained prompt) |

Typed responses include `loading`, `success`, `error`, and `empty` states.

---

## Machine learning

- Pipeline (design): Dataset → Validation → Preprocessing → Feature engineering → Train/validation → Cross-validation → Test evaluation → Model serialization → API inference.
- Models represented: Logistic Regression, Random Forest, XGBoost.
- Metrics: Accuracy, Sensitivity, Specificity, Precision, F1, ROC-AUC, Confusion Matrix, PR, Calibration.
- Every model stores: model ID, version, algorithm, training dataset version, feature list, training date, validation strategy, metrics, file location (model registry).
- **Data leakage prevention**: only features available at the defined prediction time are used. Documented future outcomes are **never** inputs.

> Replace the deterministic `pseudoPredict` in `src/app/api/predict/route.ts` with a real joblib-loaded model inference call when the trained model is available. No UI changes are required.

---

## Security & privacy

- De-identified research data only (Research Case ID, no patient names/MRNs).
- JWT auth + role-based authorization patterns available via NextAuth.
- Input validation, SQL-injection prevention (Prisma parameterised), CORS-ready.
- Audit logging on all research actions.
- Secrets/credentials/model paths are never exposed to the client.

---

## Testing

The project structure supports frontend unit tests, API tests, ML pipeline tests, and data-validation tests. Tests are organised around eligibility validation, missing/invalid values, prediction API, authentication/authorization, dataset import, and model loading. (Run via your preferred runner.)

---

## Documentation

- `DATA_DICTIONARY.md` — research variable definitions
- `MODEL_CARD.md` — model documentation
- `RESEARCH_METHODOLOGY.md` — study methodology
- `README.md` — this file

---

## Deployment

Production build:

```bash
bun run build
bun run start
```

HTTPS-ready, environment-variable driven, secure.

---

© ImplantAI Research. Research-use platform. Not a clinical diagnostic device.
