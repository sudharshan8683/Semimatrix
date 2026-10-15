# Synthetic Telemetry Generation: Methodology, Injections & Scientific Limitations

**Platform**: Semimatrix Semiconductor Monitoring  
**Source Type**: `synthetic`  
**Generator Engine**: `backend/src/services/syntheticGenerator.service.ts`  
**Command Line Reproduction**: `npm run seed:demo` (or via UI: `POST /api/v1/datasets/seed-synthetic`)

---

## 1. Provenance & Strict Labeling Policy

Every synthetic datum, chart, KPI card, and exported report in Semimatrix is tagged with:
$$\text{Source Type: } \textbf{synthetic}$$

> [!WARNING]
> **Scientific Integrity Notice**: Synthetic telemetry is generated for deterministic UI demonstration, algorithm benchmarking, and edge-case validation. **Under no circumstances is synthetic data presented as real cleanroom telemetry or as proof of real-world operational machine learning efficacy.**

---

## 2. Equipment Types & Physical Telemetry Topology

The generator models **15 tools** across 5 distinct semiconductor manufacturing tool types. Each tool type features its own dedicated physics parameters and spec limits (preventing unrealistic universal column assumptions):

1. **Deposition (CVD - Chemical Vapor Deposition)**:
   - *Stage*: CVD Dielectric Deposition
   - *Parameters*: Chamber Temperature (`degC`, 400 nominal, USL 415, LSL 385), Pressure (`mTorr`, 2500 nominal), RF Bias Power (`W`, 650 nominal), Silane Gas Flow (`sccm`, 180 nominal).
2. **Lithography Track**:
   - *Stage*: Photolithography & Coat
   - *Parameters*: Track Temperature (`degC`, 21.5 nominal, USL 22.5, LSL 20.5), Spin Speed (`RPM`, 3000 nominal), Resist Dispense Volume (`mL`, 1.85 nominal), Cleanroom Relative Humidity (`%RH`, 45.0 nominal).
3. **Plasma Etch (RIE - Reactive Ion Etcher)**:
   - *Stage*: Reactive Ion Etch
   - *Parameters*: Chamber Vacuum Pressure (`mTorr`, 45 nominal, USL 52, LSL 38), Bias Voltage (`V`, -320 nominal), Chlorine Flow (`sccm`, 85 nominal), Turbopump Vibration RMS (`mm/s RMS`, 0.42 nominal, USL 0.85).
4. **Ion Implantation**:
   - *Stage*: High-Current Implantation
   - *Parameters*: Beam Current (`mA`, 15.0 nominal), Accelerating Voltage (`kV`, 80.0 nominal), Chamber Vacuum (`uTorr`, 1.2 nominal), Cryopump Temperature (`K`, 12.5 nominal, USL 16.0).
5. **Chemical Mechanical Planarization (CMP)**:
   - *Stage*: Chemical Mechanical Polishing
   - *Parameters*: Platen Speed (`RPM`, 92 nominal), Downforce Pressure (`PSI`, 4.2 nominal), Slurry Flow Rate (`mL/min`, 180 nominal), Head Vibration (`mm/s RMS`, 0.65 nominal, USL 1.10).

---

## 3. Stochastic Modeling & Autocorrelation

Physical sensor telemetry exhibits temporal correlation and thermal inertia. Telemetry is modeled as an **Autoregressive Process of Order 1, $AR(1)$**:

$$X_t = \mu + \phi (X_{t-1} - \mu) + \epsilon_t$$

Where:
- $\mu$: Nominal engineering setpoint
- $\phi = 0.65$: Autoregressive autocorrelation coefficient (capturing sensor inertia)
- $\epsilon_t \sim \mathcal{N}(0, \sigma^2)$: Gaussian white noise generated via Box-Muller transformation:
  $$\sigma = 0.08 \times (\text{USL} - \text{Nominal})$$
- Physical hard clamping: Values are bounded within plausible physical limits $[X_{\min}, X_{\max}]$.

---

## 4. Injected Anomalies (Ground Truth Event Registry)

To evaluate detector precision, recall, false alarm rate, and lead time, known anomalies are deterministically injected and stored in the `InjectedEvent` collection:

| Event ID | Target Tool | Injected Phenomenon | Failure Mechanism | Duration / Horizon | Ground Truth Label |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **INJ-01** | `DEPO-01` | **Gradual Thermal Drift** | Resistive heater coil oxidation causing gradual temperature ramp (+0.35 degC/hr) into > UCL. | 48 hours (Lead time: 24h) | `gradual_drift` |
| **INJ-02** | `ETCH-02` | **Sudden Vacuum Spike** | Throttle valve micro-sticking causing acute pressure tripwire spike (+8.5 mTorr). | 4 hours (Lead time: 2h) | `sudden_spike` |
| **INJ-03** | `CMP-01` & `LOT-2610-08` | **Contamination Yield Excursion** | Slurry agglomeration causing slurry starvation (-35 mL/min) and severe wafer defect loss (36% scrap). | 12 hours (Lead time: 6h) | `contamination_yield_excursion` |

Detection scorecards on the UI display:
- **Precision**: $\frac{\text{True Injected Detections}}{\text{Total Triggered Alarms}}$
- **Recall**: $\frac{\text{True Injected Detections}}{\text{Total Injected Events}}$
- **Mean Detection Lead Time**: $\Delta t$ between statistical alert trip and critical failure horizon.

> [!NOTE]
> All scorecard metrics are explicitly captioned: **"Evaluated strictly against synthetic injected ground truth. Not representative of unmodeled factory phenomena."**
