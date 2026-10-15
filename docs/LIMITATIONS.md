# System Boundaries, Provenance & Scientific Limitations

**Project:** Semimatrix (Semiconductor Process Intelligence & Health Monitoring)  
**Document Revision:** 1.0.0 (Production Benchmark Baseline)

---

## 1. Advisory Boundaries and Equipment Actuation

Semimatrix operates strictly as an **advisory decision-support platform**.

1. **Zero Direct Actuation:** Semimatrix does not issue direct write commands, recipe changes, setpoint alterations, or automated shutoff commands to fab cleanroom tools or Automated Material Handling Systems (AMHS).
2. **Mandatory Human-in-the-Loop:** All chamber maintenance recommendations, flow nozzle calibrations, and wafer scrap decisions must be validated and executed by qualified cleanroom equipment engineers following facility Standard Operating Procedures (SOPs).
3. **No Safety Interlock Replacement:** Semimatrix does not replace physical hardwired safety interlocks (e.g., EMO buttons, toxic gas leak interlocks, vacuum overpressure relief valves).

---

## 2. Telemetry Ingestion & Live Connection Status

1. **Demonstration Mode (`source_type: "synthetic"`):**
   - Operating on a deterministic synthetic physics simulation.
   - Sensor noise is modeled via an autoregressive $AR(1)$ process ($\phi = 0.65$) with parameter-specific variance.
   - Tool downtime and transitions are governed by discrete finite-state machines.
   - Synthetic ground-truth scores (Precision: 100%, Recall: 100%, False Alarms: 0.0/week) are valid **strictly for the injected synthetic scenarios** and must never be cited as real-world production performance.

2. **Reserved Live Telemetry (`source_type: "live"`):**
   - Live hardware connectors (SEMI E30 GEM, SEMI E37 HSMS, SEMI E164 EDA Interface A) are architecturally specified but **disabled** in this deployment.
   - See `docs/INTEGRATION_ROADMAP.md` for the technical specifications required to connect a physical cleanroom tool.

---

## 3. Machine Learning & Predictive Maintenance Constraints

### 3.1 Supervised Learning Label Scarcity
- In cleanroom environments, physical tool failures are rare, expensive, and actively prevented by scheduled preventive maintenance (PM).
- A supervised classification model requires at least 30 confirmed run-to-failure examples with known failure modes to train without severe over-fitting.
- **Current Status:** Semimatrix reports `"no supervised model: insufficient labels"` when operating on datasets without confirmed failure annotations. Instead, transparent semi-supervised anomaly detection (Isolation Forest) and deterministic drift scoring are utilized.

### 3.2 Remaining Useful Life (RUL) Policy
- **No Fabricated RUL:** Semimatrix refuses to display a countdown timer or remaining hours to failure unless a verified monotonic degradation parameter (e.g., electrostatic chuck wear, target erosion depth) and historical run-to-failure curves exist.
- Non-monotonic signals (e.g., temperature spikes or pressure hunting) trigger **Risk Scores (0–100%)** rather than speculative time-to-failure predictions.

### 3.3 SECOM Holdout Benchmark Reality
- Tested on the UCI SECOM dataset (1,567 runs, 590 sensors) using a strict chronological 80/20 train/test split (no random time-leakage).
- Holdout class balance is severely skewed: **17 fails vs. 297 passes** (5.41% failure rate).
- **PR-AUC is 0.0719** against a base rate of 0.0541.
- Raw classification accuracy is **94.59%**, which is completely deceptive: a trivial model predicting "Pass" on every wafer achieves 94.59% accuracy while catching zero defects.
- Top 20% risk cutoff achieves 11.76% recall (2 out of 17 failures flagged) at the cost of 15 false alarms.

---

## 4. Statistical Process Control (SPC) Boundaries

1. **Baseline Window (Phase I):**
   - Phase I control limits ($UCL, CL, LCL$) must be calculated from an established, in-control baseline sample (minimum 20–30 points).
   - Control limits are never computed dynamically from the data currently being judged (Phase II).
2. **Nelson Rules 1–4:**
   - Rule 1 (1 point > 3$\sigma$ from center line)
   - Rule 2 (9 consecutive points on same side of center line)
   - Rule 3 (6 consecutive points steadily increasing or decreasing)
   - Rule 4 (14 consecutive points alternating up and down)
   - Violations indicate non-random special cause variation; they do not automatically identify the physical mechanism.

---

## 5. Root-Cause Attribution Language

1. **No Conclusive Proof:**
   - Statistical correlation, ANOVA, and Cohen's $d$ effect sizes quantify association, not causation.
   - Semimatrix strictly outputs language such as *"associated with excursion"* and *"candidate contributor"*.
   - The platform never outputs *"root cause confirmed"*.
2. **Missing Identifiers:**
   - If uploaded data lacks wafer-lot identifiers or timestamp synchronization across stages, candidate factor ranking is disabled and an explicit notification is displayed.
