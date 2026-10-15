<div align="center">

# 🌐 SemiMatrix Fab
### Industrial Cleanroom Process Intelligence & Wafer Yield Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%205-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/ML%20Service-Python%203.11%20%7C%20FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest%20%7C%20Pytest-FCC624?logo=vitest&logoColor=black)](https://vitest.dev/)
[![Status](https://img.shields.io/badge/Status-Production--Grade%20Prototype-059669)](#)

<p align="center">
  <b>A real-time semiconductor manufacturing decision-support platform designed for cleanroom tool health, wafer-lot progression, statistical process control (SPC), and yield loss attribution.</b>
</p>

[Quickstart](#-quickstart--local-setup) • [Features](#-core-functional-modules) • [Data Ingestion & ZIP Support](#-cleanroom-telemetry-ingestion) • [Architecture](#-system-architecture) • [Credentials](#-default-credentials)

---

</div>

## 📌 Executive Summary

Modern semiconductor fabrication cleanrooms generate gigabytes of high-frequency sensor telemetry across complex lithography, plasma etch, and chemical-vapor deposition processes. When chamber excursions occur, fab engineers need immediate, explainable insights rather than opaque "black-box" models.

**SemiMatrix Fab** bridges the gap between raw machine telemetry and actionable engineering decisions. Built with an industrial cleanroom UI/UX and a resilient three-tier architecture, it provides:
- **Real-Time Statistical Process Control (SPC):** Phase I baseline calculations and Nelson Rules (1–3) on chamber temperature, vacuum pressure, and RF power.
- **Stage-by-Stage Wafer Yield Rollups:** Granular defect decomposition tracking good units vs. scrap count across wafer lots.
- **Adaptive Data Ingestion & ZIP Support:** Upload compressed `.zip` telemetry archives, raw `.csv`, or `.xlsx` files with automatic column profiling and formula defanging.
- **Zero-Fabrication Capability Matrix:** Transparently verifies which algorithms can mathematically run on uploaded datasets — missing columns are disabled without fabricating data.

---

## 🚀 Core Functional Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FAB OPERATIONS & TELEMETRY                      │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│   📊 Overview    │   🔬 Equipment   │  📈 Production  │   🚨 Alerts    │
│ Real-Time Health │  15 Cleanroom    │  Wafer Yield &  │  Excursion &   │
│   & Fleet Risk   │  Tools Across    │   Stage Scrap   │    Incident    │
│     Rollups      │  5 Process Bays  │  Decomposition  │     Triage     │
└──────────────────┴──────────────────┴─────────────────┴────────────────┘
                                  │
┌─────────────────────────────────┴──────────────────────────────────────┐
│                      DATA INGESTION & CAPABILITY                       │
│  📁 Datasets & Mapping: CSV, XLSX, ZIP Auto-Extraction & Profiling     │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Operations Overview (`/overview`)
- **Fleet Health Status:** Real-time visibility across all 15 cleanroom tools categorized into *Nominal*, *Parameter Drift*, and *Critical Excursion*.
- **Live KPI Banners:** Instant metrics for *Operational Availability*, *Active Alerts*, *Current Wafer Yield (vs. target)*, and *Predicted Fleet Risk*.
- **Equipment Queue:** Interactive triage table with direct tool inspection, risk scoring, and recommended engineer actions.
- **Dual Source Switching:** Seamlessly toggle between **Simulated Demo Data** (15 pre-seeded cleanroom tools) and **User-Uploaded Telemetry**.

### 2. Equipment Health (`/equipment`)
- **5 Process Bays Monitored:** LPCVD furnaces, High-Density Plasma Etchers, DUV Stepper Scanners, Chemical Mechanical Planarization (CMP), and Ion Implanters.
- **Shewhart I-Charts:** Continuous parameter charts with Upper/Lower Control Limits (UCL / LCL) and automated Nelson Rule tripwires (Rule 1: outlier beyond 3σ, Rule 2: nine consecutive points on one side of center line, Rule 3: six consecutive points steadily trending).

### 3. Production & Yield Analytics (`/yield`)
- **Stage Scrap Decomposition:** Step-by-step defect loss breakdown across wafer lots.
- **Lot Traceability:** Track wafer carriers from initial deposition through final implant and metrology inspection.
- **Line Yield Calculations:** Automated pass rate formulas (`good_units / total_units * 100`) with variance tracking.

### 4. Alerts & Incidents (`/alerts`)
- **Triaged Event Stream:** Severity-ranked cleanroom excursions (*Critical*, *Warning*, *Info*).
- **Incident Lifecycle:** Complete status workflows (`Open` ➔ `Acknowledged` ➔ `Resolved`).
- **Audit Trails:** Immutable logging of user interventions and timestamped timestamps.

### 5. Datasets & Auto-Mapping (`/datasets`)
- **Multi-Format Ingestion:** Drag-and-drop `.csv`, `.xlsx`, or `.zip` files up to 50MB.
- **ZIP Auto-Extraction:** Safely unzips archives, detects cleanroom tabular files, and strips OS metadata.
- **Semiconductor Synonym Engine:** Auto-maps arbitrary sensor headers (`temp_c`, `press_mtorr`, `carrier_id`) to canonical cleanroom parameters (`temperature`, `pressure`, `wafer_lot_id`).
- **Capability Matrix:** Mathematical verification engine confirming algorithm readiness:
  - ✅ **Wafer Yield Analysis** (Requires: `total_units`, `good_units` / `defect_count`)
  - ✅ **SPC Control Charts** (Requires: `timestamp`, at least one numeric sensor)
  - ✅ **Predictive Equipment Health** (Requires: `equipment_id`, `timestamp`, numeric telemetry)
  - ✅ **Lot-to-Tool Traceability** (Requires: `wafer_lot_id`, `equipment_id`)

---

## 📦 Cleanroom Telemetry Ingestion

SemiMatrix Fab is tailored for semiconductor fabrication cleanrooms. You can upload custom production data or use the pre-built sample templates.

### What Telemetry Columns Are Expected?

| Canonical Field | Recognized Synonyms | Purpose |
| :--- | :--- | :--- |
| `timestamp` | `time`, `date`, `datetime`, `ts`, `recorded_at` | Time-series chronological ordering |
| `equipment_id` | `tool_id`, `tool`, `chamber_id`, `machine_id`, `station` | Asset identification & tool routing |
| `equipment_type`| `tool_type`, `machine_type`, `bay_type`, `category` | Process classification (CVD, Etch, Litho, CMP, Implant) |
| `wafer_lot_id` | `lot_id`, `lot`, `batch_id`, `run_id`, `carrier_id` | Wafer lot traceability across stages |
| `temperature` | `temp`, `chamber_temp`, `temp_c`, `chuck_temp`, `heater_temp` | Thermal sensor telemetry (SPC monitoring) |
| `pressure` | `chamber_pressure`, `vac_pressure`, `vacuum`, `press_mtorr` | Vacuum / pressure telemetry |
| `vibration` | `vib`, `pump_vibration`, `rms_vibration`, `accel_rms` | Mechanical pump & spindle health |
| `current` | `beam_current`, `bias_current`, `motor_current`, `amps` | RF power & electrical current |
| `total_units` | `total_wafers`, `inspected_units`, `batch_size`, `wafers_in` | Denominator for yield computation |
| `good_units` | `passed_wafers`, `pass_count`, `good_wafers`, `wafers_out` | Passing units for line yield |
| `defect_count` | `defects`, `fails`, `failed_wafers`, `scrapped_units` | Scrap count decomposition |
| `failure_label`| `failure`, `fail`, `is_failure`, `maintenance_required` | Supervised fault classification ground truth |

### 📥 Sample Cleanroom Datasets

Pre-built sample cleanroom datasets are included in the repository for immediate testing:
- **Sample CSV:** [`frontend/public/semimatrix_synthetic_cleanroom_data.csv`](frontend/public/semimatrix_synthetic_cleanroom_data.csv)
- **Sample ZIP:** [`frontend/public/semimatrix_cleanroom_sample.zip`](frontend/public/semimatrix_cleanroom_sample.zip)

*(You can also download these directly from within the in-app **Upload Dataset** modal with 1 click).*

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (PORT 5173)                     │
│  React 18 • Vite 5 • Tailwind CSS • Lucide Icons • Responsive Layout   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST & JWT Cookies
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      BACKEND API GATEWAY (PORT 5000)                   │
│  Node.js • Express • TypeScript • Zod Validation • AdmZip Safe Parser  │
├────────────────────────────────────────────────────────────────────────┤
│  Services:                                                             │
│  • DatasetUploadService (Magic Bytes, Defanging, Profiling, Mapping)   │
│  • MetricsService (Shewhart SPC, Nelson Rules, Availability, Yield)    │
│  • SeedService (Cleanroom 15-Tool Demo Generator & Persistence)        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│        DATA PERSISTENCE LAYER       │  │    PYTHON ML ENGINE (PORT 8000│
│  Dual-Mode Storage Architecture:    │  │  FastAPI • Scikit-Learn •     │
│  • External MongoDB (when MONGODB_URI)│  │  Isolation Forest • RUL Model │
│  • High-Performance Disk In-Memory  │  │  UCI SECOM Benchmark Pipeline │
│    with .store_*.json persistence   │  └───────────────────────────────┘
└─────────────────────────────────────┘
```

### Cleanroom Security & Protection
1. **Formula Defanging (Anti-CSV Injection):** Sanitizes spreadsheet cells starting with `=`, `+`, `-`, or `@` by prepending `'` to prevent remote execution in Excel.
2. **Macro Rejection:** Strictly rejects `.xlsm` (macro-enabled workbooks) to eliminate VBA payload risks.
3. **Archive Extraction Protection:** Blocks dangerous script or executable files (`.exe`, `.bat`, `.sh`, `.cmd`) inside uploaded `.zip` archives.
4. **Magic Byte Verification:** Inspects binary headers (`50 4B` for ZIP/XLSX) to prevent file extension spoofing.

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Python:** v3.11 with virtual environment support
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/sudharshan8683/Semimatrix.git
cd Semimatrix
```

### 2. Start the Python ML Service
In your first terminal:
```powershell
# Windows PowerShell:
.\.venv\Scripts\activate
python -m uvicorn main:app --app-dir ml/service --host 127.0.0.1 --port 8000

# macOS / Linux:
source .venv/bin/activate
python -m uvicorn main:app --app-dir ml/service --host 127.0.0.1 --port 8000
```
> **Verification:** Navigating to `http://localhost:8000/health` returns `{"status":"healthy","service":"semimatrix-ml-service"}`.

### 3. Start the Backend API
In your second terminal:
```bash
cd backend
npm install
npm run dev
```
> **Verification:** Navigating to `http://localhost:5000/health` returns `{"status":"healthy","app":"Semimatrix"}`.

### 4. Start the Frontend Application
In your third terminal:
```bash
cd frontend
npm install
npm run dev
```
> **Verification:** Open `http://localhost:5173` in your browser.

---

## 🔑 Default Credentials

The platform includes pre-seeded operator accounts that persist across reboots:

| User Account | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Engineer** | `sudharsudhar2234@gmail.com` | `Sudharshan@2007` | Owner | Full Cleanroom Admin & Ingestion |
| **Demo Operator** | `demo@semimatrix.local` | `Semimatrix123!` | Owner | Full Cleanroom Admin & Ingestion |
| **Lead Process Engineer** | `engineer@semimatrix.local` | `Semimatrix123!` | Owner | Full Cleanroom Admin & Ingestion |

*(You can also register a new custom account anytime on the [Register Screen](http://localhost:5173/register)).*

---

## 🧪 Automated Test Suites

The repository contains automated unit and integration tests across all tiers:

```bash
# Run Backend Vitest Suite (7 unit tests including ZIP extraction & defanging)
cd backend
npm test

# Run Python ML Pipeline Tests
.\.venv\Scripts\python.exe -m pytest ml/tests/test_pipeline.py -v

# Verify Frontend Production Build (Typecheck & Minification)
cd frontend
npm run build
```

---

## 📜 Regulatory Notice & Safety Policy

> **ADVISORY ONLY:** SemiMatrix Fab is engineered as an industrial decision-support and process intelligence platform. It does not issue physical write commands, recipe modifications, or safety interlock overrides to semiconductor manufacturing tools (SECS/GEM, AMHS vehicles). All physical maintenance interventions must be verified and performed by authorized cleanroom process personnel.

---

<div align="center">
  <sub>Built with ❤️ for Semiconductor Cleanroom Engineering & Process Intelligence</sub>
</div>
