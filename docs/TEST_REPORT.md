# Comprehensive Test Execution Report

**Project:** Semimatrix (Semiconductor Process Intelligence & Decision Support)  
**Execution Timestamp:** 2026-10-14 23:35:10 UTC+5:30  
**Overall Status:** PASSED (All 34 automated unit/integration tests passing; zero build errors)

---

## 1. Executive Summary

| Test Domain | Runner / Engine | Suites | Tests Executed | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Backend Integration & Unit** | Vitest 3.2.7 (Node.js v24.18.0) | 8 | 29 | 29 | 0 | **PASSED** |
| **Python ML Microservice** | Pytest 9.1.1 (Python 3.11.0) | 1 | 5 | 5 | 0 | **PASSED** |
| **Frontend Production Build** | TypeScript 5.2.0 + Vite 5.4.21 | — | 2,689 modules | 2,689 | 0 | **PASSED** |
| **Seeded Demo Generator** | Node CLI (`seed:demo`) | 1 | 1 | 1 | 0 | **PASSED** |

---

## 2. Backend Automated Test Suite (Vitest)

Command executed:
```powershell
$env:PATH = "C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;" + $env:PATH; npm --prefix backend test
```

### Actual Terminal Output:
```text
> semimatrix-backend@1.0.0 test
> vitest run

 RUN  v3.2.7 C:/Users/asus/Downloads/Semimatrix/backend

 ✓ tests/unit/spc_nelson_rules.test.ts (6 tests) 11ms
 ✓ tests/unit/yield_analytics.test.ts (2 tests) 15ms
 ✓ tests/unit/metrics_consistency.test.ts (6 tests) 53ms
 ✓ tests/unit/synthetic_generator.test.ts (1 test) 167ms
 ✓ tests/unit/predictive_maintenance.test.ts (2 tests) 70ms
 ✓ tests/unit/investigation_and_reports.test.ts (4 tests) 27ms
 ✓ tests/unit/dataset_upload.test.ts (6 tests) 63ms
 ✓ tests/integration/auth_isolation.test.ts (2 tests) 2866ms
   ✓ Stage 1: Multi-Tenant Data Isolation and Authorization Security > proves User A cannot read, modify, or delete User B resources by manipulated IDs  1451ms
   ✓ Stage 1: Multi-Tenant Data Isolation and Authorization Security > enforces delete-my-data: cleans up user A data while leaving user B intact  1412ms

 Test Files  8 passed (8)
      Tests  29 passed (29)
   Start at  23:34:36
   Duration  7.29s (transform 2.04s, setup 0ms, collect 13.88s, tests 3.27s, environment 4ms, prepare 3.34s)
```

### Verified Test Assertions:
1. **Multi-Tenant Isolation (`auth_isolation.test.ts`):**
   - Proves User A cannot read, modify, or delete User B equipment, datasets, lots, or alerts using manipulated resource IDs (returns HTTP 404).
   - Proves `delete-my-data` cleans up User A's workspace documents while leaving User B's resources untouched.
2. **Deterministic Metrics Single Source of Truth (`metrics_consistency.test.ts`):**
   - Proves mathematically that Availability, Utilization, Yield, Defect Rate, and Throughput formulas match across overview KPI cards, charts, and table summaries.
3. **Statistical Process Control (`spc_nelson_rules.test.ts`):**
   - Validates Phase I baseline control limits ($UCL = \bar{X} + 2.66 \cdot \overline{MR}$, $LCL = \bar{X} - 2.66 \cdot \overline{MR}$).
   - Validates Nelson Rules 1 (point > $3\sigma$), Rule 2 (9 points on same side of center line), Rule 3 (6 points trending), and Rule 4 (14 alternating points).
4. **Dataset Upload & Defanging (`dataset_upload.test.ts`):**
   - Verifies rejection of macro-enabled workbooks (`.xlsm`).
   - Verifies neutralization of formula-injection payloads (`=cmd|' /C calc'!A0`, `+`, `-`, `@`).
   - Verifies auto-mapping synonyms and 5-point capability matrix evaluation (e.g., temperature-only dataset blocked from yield predictions).
5. **Root-Cause Investigation & Reporting (`investigation_and_reports.test.ts`):**
   - Validates Cohen's $d$ effect size calculation and cautious technical wording (*"associated with"*, never *"root cause confirmed"*).
   - Validates formula-defanged CSV export.

---

## 3. Python ML Microservice Test Suite (Pytest)

Command executed:
```powershell
$env:PATH = "C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;" + $env:PATH; & ".\.venv\Scripts\python.exe" -m pytest ml/tests/test_pipeline.py -v
```

### Actual Terminal Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.11.0, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\asus\Downloads\Semimatrix\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\asus\Downloads\Semimatrix
plugins: anyio-4.15.1
collecting ... collected 5 items

ml/tests/test_pipeline.py::test_health_check PASSED                      [ 20%]
ml/tests/test_pipeline.py::test_anomaly_scoring_clean_telemetry PASSED   [ 40%]
ml/tests/test_pipeline.py::test_anomaly_scoring_out_of_spec_tripwire PASSED [ 60%]
ml/tests/test_pipeline.py::test_health_risk_honest_label_documentation PASSED [ 80%]
ml/tests/test_pipeline.py::test_secom_benchmark_metrics PASSED           [100%]

======================== 5 passed, 2 warnings in 2.78s ========================
```

### Verified ML Assertions:
1. **SECOM Benchmark Verification:**
   - Evaluated on 314 time-ordered holdout runs without random time-leakage.
   - Accurately asserts PR-AUC is 0.0719 (base rate: 0.0541).
   - Confirms transparent documentation that naive 94.6% classification accuracy is deceptive due to 17/314 class imbalance.
2. **Tripwire Anomaly Scoring:**
   - Proves severe parameter deviations trip high anomaly scores with exact parameter attribution.
3. **Health Risk Label Scarcity:**
   - Asserts that without $\ge 30$ confirmed run-to-failure examples, the service reports `"no supervised model: insufficient labels"`.

---

## 4. Frontend Production Compilation Verification

Command executed:
```powershell
$env:PATH = "C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;" + $env:PATH; npm --prefix frontend run build
```

### Actual Terminal Output:
```text
> fabsense-frontend@0.0.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
transforming...
✓ 2689 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.56 kB │ gzip:   0.37 kB
dist/assets/index-CZyC1OUP.css   61.78 kB │ gzip:  10.67 kB
dist/assets/index-DJeJAYeQ.js   956.31 kB │ gzip: 273.99 kB
✓ built in 51.67s
```

All 2,689 frontend modules compiled with zero TypeScript diagnostics, zero missing imports, and strict types.

---

## 5. Seeded Demo Data CLI Execution

Command executed:
```powershell
$env:PATH = "C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;" + $env:PATH; npm --prefix backend run seed:demo
```

### Verified Output:
- Generated 15 equipment records across 5 types (CVD, Etch, Litho, CMP, Implant).
- Generated 7 days of continuous cleanroom telemetry (15,120 readings) with $AR(1)$ autocorrelation noise ($\phi = 0.65$).
- Injected 3 ground-truth excursion scenarios:
  1. `CMP-01`: Slurry dispense flow rate degradation (starting Day 4).
  2. `ETCH-02`: RF reflected power gradual drift (starting Day 3).
  3. `LITHO-01`: Resist bake temperature thermocouple stuck sensor (starting Day 5).
- Exported reproducible benchmark file: `backend/uploads/semimatrix_seeded_demo.csv`.

---

## 6. Usability Layer & Onboarding Test Execution (Stage 0–6)

**Execution Timestamp:** 2026-10-15 00:04:31 UTC+5:30  
**Overall Status:** PASSED (39 Vitest tests, 5 Pytest tests, 2,693 Vite modules compiled)

### Test Suite Summary:
```text
 RUN  v3.2.7 C:/Users/asus/Downloads/Semimatrix/backend

 ✓ tests/unit/summary_templates.test.ts (5 tests) 9ms
 ✓ tests/unit/spc_nelson_rules.test.ts (6 tests) 11ms
 ✓ tests/unit/yield_analytics.test.ts (2 tests) 12ms
 ✓ tests/unit/metrics_consistency.test.ts (6 tests) 39ms
 ✓ tests/unit/synthetic_generator.test.ts (1 test) 133ms
 ✓ tests/unit/dataset_upload.test.ts (6 tests) 53ms
 ✓ tests/unit/investigation_and_reports.test.ts (4 tests) 24ms
 ✓ tests/unit/predictive_maintenance.test.ts (2 tests) 144ms
 ✓ tests/integration/sample_data_scenarios.test.ts (5 tests) 1756ms
 ✓ tests/integration/auth_isolation.test.ts (2 tests) 2391ms

 Test Files  10 passed (10)
      Tests  39 passed (39)
```

### Verified Usability Assertions:
1. **Deterministic Plain-Language Summary Templates (`summary_templates.test.ts`):**
   - Asserts non-causal wording (`"associated with"`, `"candidate contributor"`, never `"confirmed root cause"`).
   - Generates deterministic alerts, drift summaries, yield loss attribution, and maintenance recommendations from computed facts without LLM dependencies.
2. **Path A Sample Data Scenarios (`sample_data_scenarios.test.ts`):**
   - Validates reproducible generation across scenarios: `drift`, `yield_loss`, `spike`, and `normal`.
   - Asserts target finding routing (e.g. `/equipment?selected=DEPO-01` for drift, `/yield` for yield loss).
   - Verifies 401 on unauthenticated generation and 404 cross-workspace data isolation when User B attempts to access User A's generated dataset or sample CSV.
3. **Frontend Production Build:**
   - Compiled 2,693 modules cleanly (`dist/assets/index-DsTQuw6f.js`, `dist/assets/index-fZByO5Q3.css`).

