# Semimatrix: Architecture, Domain Model & Implementation Plan

**Project**: Semimatrix (B.Tech Technical Demonstration Platform)  
**Domain**: Semiconductor Manufacturing Monitoring, Equipment Health, Wafer-Lot Yield Analytics, and Explainable Predictive Maintenance  
**Baseline Date**: October 2026  
**Status**: Stage 0 Complete — Active Implementation

---

## 1. Executive Summary & Design Principles

Semimatrix is an industrial-grade semiconductor manufacturing analytics and decision-support platform designed to monitor wafer fabrication equipment health, wafer-lot progression, yield excursions, and predictive maintenance tripwires. 

The application is engineered strictly around five core tenets:
1. **Mathematical Correctness & Single Source of Truth**: Every operational KPI (Availability, Utilization, Yield, Defect Rate, Throughput, Cp, Cpk) is computed through a single shared metric engine. Cards, tables, charts, and downloadable reports must agree.
2. **Data Provenance & Scientific Honesty**: Every datum, visualization, and prediction is visibly tagged with a `source_type` (`synthetic`, `uploaded`, `benchmark` [SECOM], or `live` [reserved/disabled]). Synthetic data is never masqueraded as real factory telemetry or evidence of real-world ML efficacy.
3. **Multi-Tenant Security & Per-User Isolation**: Every domain record is partitioned by `workspaceId` derived strictly from authenticated HTTP-only session tokens. Cross-workspace resource lookups return `404 Not Found`.
4. **End-to-End Operational Integrity**: Deterministic engineering bounds take precedence over opaque machine learning. ML is reserved for statistical anomaly detection and benchmark validation, and always accompanied by feature attribution and confidence intervals.
5. **Industrial SCADA/MES Aesthetics**: Information-dense, calm, distraction-free interface inspired by cleanroom fab software. No decorative glassmorphism, animated counters, or marketing fluff.

---

## 2. Baseline Inspection Findings (Stage 0)

An inspection of the workspace and inherited assets revealed the following baseline state:

- **Repository Layout**:
  - `ml/`: Contains the UCI SECOM dataset (`data/secom/secom.data` [1,567 runs x 590 sensors], `secom_labels.data`, `secom.names`), automated preprocessing (`preprocess.py`), feature screening (`feature_study.py`), baseline modeling (`train_baseline.py`), and test evaluation (`final_evaluate.py`).
  - `.venv/`: Python 3.11 virtual environment with `fastapi 0.142.1`, `scikit-learn 1.9.1`, `pandas 3.0.6`, `numpy 2.4.6`, `shap 0.51.0`, and `pytest 9.1.1`.
  - `frontend/`: React 18, Vite 5, TypeScript 5.2, Tailwind CSS 3.4, TanStack React Query 5, Recharts 2.10, and Lucide React.
  - `legacy_backend/`: Prior FastAPI + SQLite implementation preserved for domain formula and parameter references.
- **Baseline Build & Test Analysis**:
  - `frontend`: TypeScript compiler (`tsc -b`) identified unused imports across several view pages and missing `vite/client` environment typings. Requires configuration hardening and refactoring to meet the calm, industrial visual standard.
  - `ml`: Baseline SECOM model evaluation (`ml/results/final_test_metrics.json`) confirms realistic imbalanced classification results on a 314-sample holdout test set: PR-AUC is 0.0719, ROC-AUC is 0.5506, and a 0.5 decision threshold captures 0 true positives due to extreme 17/314 class rarity. Top 20% score flagging captures 2 true positives (11.76% recall, 3.17% precision). These honest metrics will be transparently showcased in the Model Card.
  - `backend`: Transitioning to the specified architecture: Node.js + Express + TypeScript + Mongoose + Zod, with embedded `mongodb-memory-server` fallback for zero-configuration, reproducible evaluation.

---

## 3. System Architecture

```
+---------------------------------------------------------------------------------+
|                                 FRONTEND                                        |
|  React 18 + Vite + TypeScript + TanStack Query + Tailwind CSS + Recharts       |
|  Dense SCADA Tables | SPC X-bar/R Charts | Nelson Rules | Dual-Encoded Badges   |
+---------------------------------------+-----------------------------------------+
                                        | HTTP / JSON (Secure Cookies, CSRF/CORS)
                                        v
+---------------------------------------------------------------------------------+
|                            NODE.JS + EXPRESS BACKEND                            |
|  Layered: Routes -> Controllers -> Services -> Repositories                     |
|  - Auth: Argon2/Bcrypt + Rotating Refresh Tokens in httpOnly Cookies            |
|  - Multitenancy: Strict workspaceId filter on all queries                       |
|  - Input Validation: Zod schemas on every endpoint                             |
|  - CSV/XLSX Parser: Magic byte verification, stream parsing, formula defanging  |
|  - Shared Metrics: Mathematical engine for OEE, SPC, Yield, Cp/Cpk             |
|  - Logging: Pino structured logger with PII & token redaction                   |
+-------------------+---------------------------------------+---------------------+
                    | Mongoose                              | HTTP (Internal)
                    v                                       v
+-----------------------------------+   +-----------------------------------------+
|             MONGODB               |   |            PYTHON ML SERVICE            |
|  - Time-series collections        |   |  FastAPI (Stateless on ml/service)      |
|    (Sensor readings)              |   |  - SECOM Wafer Defect Scoring           |
|  - Standard collections           |   |  - Isolation Forest Tool Anomalies      |
|    (Equipment, Lots, Datasets,    |   |  - Health Degradation Index             |
|     Alerts, Reports, AuditLogs)   |   |  - Model Card Metadata Generation       |
+-------------------+---------------+   +-----------------------------------------+
```

---

## 4. Domain Data Model & Equipment Parameter Catalogue

Semiconductor equipment bays do not share universal sensors. Semimatrix maintains an explicit per-equipment-type catalogue:

| Equipment Type | Process Stage | Dedicated Telemetry Parameters | Engineering Units | Nominal | Upper/Lower Spec Limits |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deposition (CVD)** | CVD Dielectric Deposition | Chamber Temperature, Vacuum Pressure, RF Bias Power, Silane (SiH4) Flow, Susceptor Position | `degC`, `mTorr`, `W`, `sccm`, `mm` | 400 degC, 2500 mTorr, 650 W, 180 sccm | +/- 3.5 sigma |
| **Plasma Etch** | Reactive Ion Etch (RIE) | Chamber Pressure, Bias Voltage, Chlorine (Cl2) Flow, Helium Backing Pressure, Turbopump Vibration | `mTorr`, `V`, `sccm`, `Torr`, `mm/s RMS` | 45 mTorr, -320 V, 85 sccm, 8.5 Torr, 0.42 mm/s | +/- 3.0 sigma |
| **Chemical Mechanical Planarization (CMP)** | Surface Planarization | Platen Speed, Downforce Pressure, Slurry Flow Rate, Pad Temperature, Head Vibration | `RPM`, `PSI`, `mL/min`, `degC`, `mm/s RMS` | 92 RPM, 4.2 PSI, 180 mL/min, 48 degC, 0.65 mm/s | +/- 3.0 sigma |
| **Lithography Track** | Photolithography & Coat | Track Temperature, Spin Speed, Resist Dispense Volume, Cleanroom Relative Humidity, Exhaust Static | `degC`, `RPM`, `mL`, `%RH`, `Pa` | 21.5 degC, 3000 RPM, 1.85 mL, 45.0 %RH, 125 Pa | +/- 2.5 sigma |
| **Ion Implant** | High-Current Implantation | Beam Current, Accelerating Voltage, Chamber Vacuum, Cryopump Temperature, Dose Uniformity | `mA`, `kV`, `uTorr`, `K`, `%` | 15.0 mA, 80.0 kV, 1.2 uTorr, 12.5 K, 99.2 % | +/- 3.0 sigma |

### Universal Operational Metrics
- **Availability**: `(Scheduled Time - Unscheduled Downtime) / Scheduled Time`
- **Utilization**: `Productive Processing Time / Available Time`
- **Wafer Yield**: `Good Wafers / Total Inspected Wafers`
- **Defect Rate**: `Defect Count / Total Wafers` (or `1 - Yield`)
- **Throughput**: `Wafers Processed / Operational Hours`

---

## 5. Implementation Stages & Verification Gates

### Stage 1: Core Foundation & Tenant Isolation
- Setup Node.js + Express + TypeScript backend framework.
- Implement Central Error Handler with machine-readable error codes (`AUTH_INVALID_CREDENTIALS`, `RESOURCE_NOT_FOUND`, `FORBIDDEN_WORKSPACE`).
- Configure Pino logging with redaction for tokens, emails, and sensor values.
- Mongoose connection setup supporting URI or embedded in-memory database for testing.
- Implement User and Workspace models with Argon2/Bcrypt password hashing and JWT cookies.
- Build Workspace isolation middleware: `req.workspaceId` is locked to session, never accepted from client body/query.
- **Verification Gate**: Unit tests and authorization integration tests proving User A receives HTTP 404/403 when requesting User B's resources.

### Stage 2: Data Ingestion, Profiling, Mapping & Seeded Generator
- Deterministic synthetic data generator (`npm run seed:demo`) supporting 12-20 tools across 5 equipment types, multi-stage lots, and injected anomalies (gradual drift, sudden spike, stuck sensor, yield excursion, maintenance recovery).
- Separate Ground Truth collection storing injected anomalies for honest detector scoring.
- File upload pipeline accepting `.csv` and `.xlsx` with magic byte validation, 25MB cap, and formula defanging (`'`, `=+ - @`).
- Profiler: schema type inference, missing value rates, constant column detection, physical boundary checks.
- Column auto-mapper with confidence score and workspace mapping templates.
- Analysis Capability Matrix: dynamically checks field readiness (Yield, SPC, Anomaly Detection, Lot Correlation) and provides clear diagnostic reasons when blocked.
- **Verification Gate**: Upload tests (oversized, macro-enabled rejection, formula defanging) and generator repeatability test with identical seeds.

### Stage 3: Shared Metrics Engine & Operations Dashboard
- Single-source metrics calculator (`src/metrics/calculations.ts`) unit-tested against hand-computed benchmark values.
- Operations Overview API returning unified KPIs (Availability, Utilization, Yield, Active Alarms, Downtime Risk).
- React Operations Overview with persistent Data Basis badge (`synthetic`, `uploaded`, `benchmark`, `live`).
- **Verification Gate**: Assert that Dashboard KPI tiles, charts, and table summaries match exact metric recomputations.

### Stage 4: Equipment Inventory & Statistical Process Control (SPC)
- Equipment list with dual-status pills, bay filtering, and real-time telemetry gauges.
- Detail drawer with Phase I baseline control limit calculations (UCL, CL, LCL for Individuals and Moving Range / X-bar).
- Nelson / Western Electric Rules evaluation (Rule 1: 1 point > 3 sigma; Rule 2: 9 points on one side of center; Rule 3: 6 consecutive points increasing/decreasing; Rule 4: 14 alternating points).
- Process capability indices ($C_p, C_{pk}$) rendered only when engineering spec limits exist.
- **Verification Gate**: Deterministic test verifying Nelson rule detections on synthetic test sequences.

### Stage 5: Lot Traceability & Yield Analytics
- Lot tracking table displaying wafer batch progression through CVD -> Litho -> Etch -> Implant -> CMP.
- Stage-by-stage defect distribution and yield loss attribution.
- Equipment-to-yield correlation analysis identifying outlier tools.
- **Verification Gate**: Verify lot yield rollups match sum of good units / total units across all stages.

### Stage 6: Python ML Service & SECOM Benchmark
- FastAPI stateless service in `ml/service`:
  - `/predict/secom`: SECOM wafer defect scoring with probability and flag thresholds.
  - `/anomaly/score`: Robust z-score + Isolation Forest tool anomaly detection.
  - `/health/index`: Multi-factor health score (drift, alarm rate, time since PM).
- Model Card view: documents UCI SECOM training size, 17/314 holdout class distribution, PR-AUC (0.0719), precision, recall, and intentional trade-offs.
- Detection scorecard on synthetic ground truth (precision, recall, false alarm rate, lead time).
- **Verification Gate**: Pytest suite for ML pipeline + Node integration tests asserting resilient fallback if ML service is unreachable.

### Stage 7: Root-Cause Investigation, Alerts & Reporting
- Investigation View for excursions: timelines, candidate factor ranking with effect sizes, sample counts, and cautious language ("candidate contributor", never "confirmed root cause").
- Alert triage workflow (Open -> Acknowledged -> Resolved) with audit logging.
- Server-side PDF and CSV report generator embedding data basis, findings, charts, and explicit limitations.
- **Verification Gate**: Audit log validation for alert acknowledgments and PDF report generation verification.

### Stage 8: System Hardening, Documentation & Verification
- Playwright E2E end-to-end user flow: Registration -> Dataset Creation -> Mapping -> Dashboard -> Investigation -> Alert Acknowledgment -> Report Export.
- Complete documentation suite: `docs/METRICS.md`, `docs/SYNTHETIC_DATA.md`, `docs/MODEL_CARD.md`, `docs/LIMITATIONS.md`, `docs/INTEGRATION_ROADMAP.md`, and `docs/TEST_REPORT.md`.
- Final audit for accessibility, security, and performance.

---

## 6. Risk Matrix & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Imbalanced SECOM Data** | Low precision at standard thresholds | Transparently display PR-AUC instead of misleading accuracy; include threshold sensitivity sliders with clear warning notes. |
| **CSV/Excel Formula Injection** | Security vulnerability in exported reports | Defang all untrusted string fields prefixed with `=`, `+`, `-`, or `@` by prepending `'` on ingestion and export. |
| **Cross-Tenant Data Leakage** | Severe privacy violation | Enforce Mongoose query plugins and repository decorators that mandate `workspaceId` scoping on every single DB read/write. |
| **ML Service Outage** | Unresponsive dashboard | Node backend wraps all ML calls in circuit-breaker timeouts and gracefully falls back to deterministic rule-based scoring with a visible UI disclaimer. |
| **Drift False Alarms** | Operational fatigue | Implement user-definable Phase I baseline calculation windows; separate statistical alerts from critical safety alarms. |

---

## 7. Explicit Scope Boundaries (What Will NOT Be Built)

1. **No Closed-Loop Equipment Actuation**: Semimatrix is strictly an advisory decision-support platform. It does not send write commands, modify tool recipes, or actuate hardware valves.
2. **No SECS/GEM or SEMI EDA Live Hardware Interface**: Real cleanroom hardware links require specialized licensed protocols. A documented architectural connector interface will be provided in `docs/INTEGRATION_ROADMAP.md` without fake hardware claims.
3. **No Unsubstantiated Remaining Useful Life (RUL)**: RUL is only estimated when monotonic wear signals exist; otherwise tools report health indices and maintenance risk categories.
4. **No Deep Learning Over-Engineering**: The SECOM tabular dataset (590 features, 1,567 rows) is handled using sound feature selection and tree-based/linear models.
