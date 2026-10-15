# Semimatrix: Semiconductor Manufacturing Decision-Support Platform

Semimatrix is an industrial-grade manufacturing intelligence and decision-support platform designed for cleanroom equipment health, wafer-lot progression, yield loss attribution, and predictive maintenance. Developed as a research project for technical panel demonstration, the platform enforces strict data provenance, multi-tenant workspace isolation, statistical process control (SPC), and explainable anomaly detection.

---

## 1. Architectural Overview

The application utilizes a decoupled, three-tier architecture:

```
+---------------------------+       +-----------------------------+       +------------------------+
|      Frontend Web UI      | ----> |     Node.js API Gateway     | ----> |    Python ML Service   |
|   React (Vite) + Tailwind |       |   Express + TypeScript      |       |   FastAPI + Scikit-Learn |
|   Port 5173               | <---- |   Port 5000                 | <---- |   Port 8000 (Stateless)|
+---------------------------+       +--------------+--------------+       +------------------------+
                                                   |
                                                   v
                                    +-----------------------------+
                                    |     MongoDB / In-Memory     |
                                    |     Workspace Scoped Store  |
                                    +-----------------------------+
```

1. **Frontend (`frontend/`)**: React 18 with Vite and TypeScript. SCADA/MES industrial styling with neutral slate colors, 1px borders, tabular monospace numerics, accessible contrast (WCAG AA), and persistent Data Basis badges (`synthetic`, `uploaded`, `benchmark`, `live`).
2. **Backend Gateway (`backend/`)**: Node.js + Express + TypeScript with layered structure (`routes -> controllers -> services -> repositories`). Enforces JWT access (15m) and rotating refresh (7d) authentication, Zod schema validation, Pino structured logging with PII redaction, and strict workspace isolation.
3. **Storage Layer**: Dual-mode data persistence. Connects to MongoDB when `MONGODB_URI` is provided; defaults to an isolated in-memory repository for zero-dependency execution on fresh clones.
4. **Machine Learning Microservice (`ml/`)**: Stateless Python FastAPI service. Exposes endpoints for SECOM benchmark inference, rolling anomaly scoring, and model card metadata. Persists models with Joblib.

---

## 2. Core Functional Modules

- **Accessible First-Run Onboarding (`/onboarding` & `/getting-started`)**: Restrained onboarding experience with two clearly separated paths for both domain experts and general users. Dismissible, state-persisted per user workspace.
  - **Path A ("Try with sample data")**: 1-click synthetic generator supporting reproducible scenarios (*Normal operation*, *Gradual equipment drift*, *Sudden fault*, *Contaminated lot / yield loss*), automatic canonical column mapping, direct routing to relevant finding, downloadable sample CSV, and explicit "Synthetic / simulated" data-basis badges.
  - **Path B ("Use my own data")**: 3-step guided wizard for custom CSV/XLSX cleanroom files, plain-language check explanations, column mapping review with confidence labels and sample values, plain-language capability matrix linking back to mapping, zero metric fabrication, and full dataset deletion.
- **Plain-Language Explanation Layer & Glossary (`/glossary`)**: Dedicated glossary and interactive tooltips for 13 fundamental semiconductor and SPC concepts (Yield, Availability, Utilization, SPC, Control Limits, Cp/Cpk, Anomaly Score, Maintenance Risk, Correlation vs Causation, Confidence). Every finding features two layers: a deterministic plain summary first, followed by expandable technical evidence.
- **Operations Overview (`/overview`)**: Real-time line availability, wafer yield, predicted fleet risk, 7-day yield progression, two-layer operational findings with non-causal language, and equipment attention triage queue.
- **Equipment Monitoring (`/equipment`)**: 15 cleanroom tools across 5 process types (CVD, Etch, Lithography, CMP, Ion Implant). Features per-tool parameter catalogues and Shewhart I-charts with Phase I baseline control limits and Nelson Rules 1–4.
- **Lots & Yield Analytics (`/yield`)**: Wafer-lot inventory, step-by-step defect loss decomposition, tool-to-yield correlation, and chronological stage traceability.
- **Predictive Maintenance (`/predictive-maintenance`)**: Fleet degradation ranking, synthetic ground-truth detection scorecards (precision, recall, lead time), and holdout SECOM benchmark metrics.
- **Root-Cause Investigation (`/investigations`)**: Excursion timeline, candidate factor ranking with standardized effect sizes (Cohen's d), alternative explanations, and engineer verification checklists.
- **Datasets & Capability Matrix (`/datasets`)**: Drag-and-drop CSV/XLSX file ingestion, magic byte checks, macro rejection (`.xlsm`), formula defanging (`'`, `=+ - @`), synonym auto-mapping, and a 5-point capability verification matrix.
- **Alerts Center (`/alerts`)**: Severity-ranked alerts with complete lifecycle triage (Open -> Acknowledged -> Resolved) and audit log recording.
- **Reports & Export (`/reports`)**: Technical audit report generator with executive plain-language summary at the top, diagnostic findings with evidence, recommended actions, operational limitations, and formula-defanged CSV export.
- **Model Card & Limitations (`/model-card`)**: In-app transparency documentation of training data provenance, 17/314 class imbalance, and why raw accuracy (94.6%) is misleading.

---

## 3. Quickstart & Local Execution

### Prerequisites
- Node.js v18+ (tested on Node v24.18.0) and npm
- Python 3.11 with virtual environment support

### Step 1: Start the Python ML Service
In your first terminal:
```powershell
# Activate Python 3.11 virtual environment
.\.venv\Scripts\activate

# Start the stateless FastAPI service on port 8000
python -m uvicorn main:app --app-dir ml/service --host 127.0.0.1 --port 8000
```
Verify: Navigating to `http://127.0.0.1:8000/health` returns `{"status":"healthy","service":"semimatrix-ml-service"}`.

### Step 2: Seed Demo Data and Start the Node Backend
In your second terminal:
```powershell
cd backend
npm install

# Seed the deterministic cleanroom demo dataset (15 tools, 15,120 readings, 3 injected excursions)
npm run seed:demo

# Start the Express API Gateway on port 5000
npm run dev
```
Verify: Navigating to `http://127.0.0.1:5000/health` returns `{"status":"healthy","app":"Semimatrix"}`.

### Step 3: Start the Frontend Application
In your third terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 4. Default Operator Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Lead Process Engineer** | `engineer@semimatrix.local` | `Semimatrix123!` | Full Workspace Owner |
| **Demo Operator** | `demo@semimatrix.local` | `Semimatrix123!` | Full Workspace Owner |

*Note: New workspaces can be provisioned via the "Register Workspace" button on the login screen.*

---

## 5. Verification & Test Suite Execution

All test suites can be executed independently:

### Backend Test Suite (Vitest)
```powershell
cd backend
npm test
```
*Executes 39 automated tests across 10 suites (summary templates, sample generation scenarios, auth isolation, metrics consistency, SPC Nelson rules, dataset upload defanging, predictive maintenance, and investigation reports).*

### Python ML Test Suite (Pytest)
```powershell
.\.venv\Scripts\python.exe -m pytest ml/tests/test_pipeline.py -v
```
*Executes 5 pipeline tests asserting SECOM benchmark metrics, tripwire anomaly scoring, and model card metadata.*

### Frontend Production Build Verification
```powershell
cd frontend
npm run build
```
*Executes `tsc -b && vite build` ensuring strict type correctness across all 2,689 frontend modules.*

---

## 6. Comprehensive Documentation Index

All architectural guidelines and scientific notes are committed in `docs/`:

1. [docs/PLAN.md](docs/PLAN.md): Initial architectural plan, data schemas, and non-goals.
2. [docs/PROGRESS.md](docs/PROGRESS.md): Chronological record of completed implementation milestones.
3. [docs/METRICS.md](docs/METRICS.md): Mathematical definitions, denominators, and tooltips for all KPIs.
4. [docs/SYNTHETIC_DATA.md](docs/SYNTHETIC_DATA.md): Cleanroom simulation parameters, AR(1) noise, and injected ground truth.
5. [docs/MODEL_CARD.md](docs/MODEL_CARD.md): SECOM model card, time-split methodology, PR-AUC, and failure modes.
6. [docs/LIMITATIONS.md](docs/LIMITATIONS.md): Operational boundaries, non-actuation policy, and label scarcity.
7. [docs/INTEGRATION_ROADMAP.md](docs/INTEGRATION_ROADMAP.md): SECS/GEM and SEMI EDA Interface A integration specifications.
8. [docs/TEST_REPORT.md](docs/TEST_REPORT.md): Verified test outputs from Vitest, Pytest, and Vite builds.

---

## 7. Safety Notice & Boundary Policy

**Advisory Only:** Semimatrix is designed strictly for diagnostic decision support. It does not send write commands, setpoint overrides, or recipe modifications to fab cleanroom tools or AMHS vehicles. All physical interventions must be verified and executed by authorized personnel.
