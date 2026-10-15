# Usability, Onboarding & Plain-Language Architecture Plan

**Document:** `docs/PLAN_USABILITY.md`  
**Purpose:** Augment Semimatrix with accessible onboarding, dual data entry paths (Path A: 1-click sample scenarios, Path B: guided user upload), and a two-layer plain-language finding architecture for non-expert evaluators.

---

## 1. Inspection Baseline & Existing Assets

1. **Test & Build Baseline:**
   - Backend Vitest: 8 suites, 29 tests passing.
   - Python ML Pytest: 5 tests passing.
   - Frontend: Vite + TypeScript compiling cleanly with zero errors.
2. **Current State:**
   - **First-login experience:** Currently lands directly on `/overview`. If unseeded, displays empty state without guiding the user.
   - **Sample data generation:** Exists via `POST /api/v1/datasets/generate-synthetic`, but generates all 3 injected scenarios simultaneously without scenario selection.
   - **Upload flow:** Exists with profiling and mapping, but lacks a step-by-step guided wizard and plain-language capability diagnostics.
   - **Data-basis badges:** `DataBasisBadge.tsx` is implemented; needs to be comprehensively audited across every chart, KPI tile, and finding.
   - **Explanations:** Technical formulas exist, but findings lack a plain-language summary layer for general evaluators.
   - **Glossary:** Missing a dedicated `/glossary` glossary directory and interactive term lookup.

---

## 2. Implementation Scope

### Stage 1: First-Run Onboarding (`/onboarding`)
- Clean, restrained onboarding screen presenting two side-by-side cards:
  - **Path A ("Try with sample data"):** Pre-configured cleanroom scenarios using synthetic simulation. Plainly explains that data is simulated and does not represent real factory accuracy.
  - **Path B ("Use my own data"):** Step-by-step guided CSV/XLSX file upload. Explains schema profiling, column mapping, and the capability matrix.
- Non-blocking, dismissible anytime.
- Persistent onboarding state saved per user in `authStore.ts` and `localStorage`.
- Persistent "Getting Started" link in the sidebar navigation.

### Stage 2: Path A — One-Click Sample Data with Scenarios
- Enhance backend `syntheticGenerator.service.ts` to support scenario selection:
  - `normal`: 15 tools operating within standard nominal tolerances.
  - `drift`: Gradual equipment drift (e.g. LPCVD furnace heater or chamber pressure drift).
  - `fault`: Sudden equipment fault (e.g. Litho track thermocouple stuck sensor or vacuum leak).
  - `yield_loss`: Wafer-lot yield excursion (e.g. CMP-01 slurry flow rate drop causing lot scrap).
- Scenario picker UI with reproducible seeds, progress indicator, and duplicate submission prevention.
- Automatic canonical mapping and instant redirection to relevant finding.
- Persistent "Data Basis: Synthetic" badge and downloadable generated CSV.

### Stage 3: Path B — Guided User Data Ingestion
- 3-step wizard in `Datasets.tsx`:
  1. *File Upload & Security Check:* File size, extension, magic byte validation, formula defanging.
  2. *Column Mapping Review:* Suggested canonical fields, confidence labels, sample values, override dropdowns.
  3. *Capability Matrix:* Plain-language status for all 5 analyses (e.g., "Yield analysis: not available — requires columns for good units and total units") with direct links back to mapping.
- Persistent "Data Basis: User-Uploaded" badge.
- Cascade deletion for uploaded datasets and derived telemetry.

### Stage 4: Plain-Language Explanation Layer
- Two-layer finding architecture:
  - **Layer 1 (Plain-Language Summary):** Generated via deterministic templates from computed facts (no LLM, no causal claims, using *"associated with"* and *"candidate contributor"*).
  - **Layer 2 (Expandable Technical Detail):** Raw sensor charts, control limits, effect sizes (Cohen's d), sample sizes, and physical engineering checklists.
- Dedicated Glossary page (`/glossary`) and interactive tooltips for:
  - Yield, Defect Rate, Availability, Utilization, Downtime, Throughput, SPC, Control Limits, Cp/Cpk, Anomaly Score, Maintenance Risk Score, Correlation vs Causation, and Confidence Label.
- Reports formatted with plain-language executive summary at the top.

### Stage 5: Data-Basis Transparency Audit
- Audit every screen, KPI tile, chart, alert, and report to display data provenance.
- Prevent silent mixing of data sources.

### Stage 6: Multi-Tenant Isolation & Test Verification
- Ensure Path A and Path B datasets are strictly isolated by `workspaceId`.
- Automated tests verifying cross-tenant access rejection (HTTP 404).
- Unit tests for deterministic plain-language summary templates.
