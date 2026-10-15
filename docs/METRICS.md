# Semimatrix: Metric Engine & Mathematical Specification

**Module**: `backend/src/metrics/calculations.ts`  
**Purpose**: Single Source of Truth for every operational KPI, process capability metric, and yield formula in the Semimatrix platform.  
**Rule**: Cards, tables, charts, and downloadable reports must read from this shared metrics module so numbers always agree.

---

## 1. Universal Operational KPIs

### 1.1. Operational Availability ($A$)
- **Formula**:
  $$A = \frac{\text{Scheduled Operating Time} - \text{Unscheduled Downtime}}{\text{Scheduled Operating Time}} \times 100\%$$
- **Numerator**: Total scheduled runtime minus unscheduled breakdown/fault duration.
- **Denominator**: Total scheduled tool operating hours in the selected time window (typically 168 hours / 7 days).
- **Engineering Unit**: `%`
- **Bounds**: $[0\%, 100\%]$
- **Tooltip Definition**: *"Fraction of planned production time during which the equipment is physically operable and not stopped by unscheduled maintenance or breakdown."*

---

### 1.2. Equipment Utilization ($U$)
- **Formula**:
  $$U = \frac{\text{Productive Recipe Processing Time}}{\text{Available Time}} \times 100\%$$
- **Numerator**: Active processing time during which wafers are actively undergoing recipe execution.
- **Denominator**: Available operable time: $(\text{Scheduled Operating Time} - \text{Unscheduled Downtime})$.
- **Engineering Unit**: `%`
- **Bounds**: $[0\%, 100\%]$
- **Tooltip Definition**: *"Percentage of available operable uptime during which wafers are actively undergoing cleanroom recipe processing."*

---

### 1.3. Wafer Yield ($Y$)
- **Formula**:
  $$Y = \left(\frac{\text{Good Wafers}}{\text{Total Inspected Wafers}}\right) \times 100\%$$
- **Numerator**: Count of inspected wafers meeting all parametric and defect acceptance criteria.
- **Denominator**: Total inspected wafers completing metrology inspection across all lots in the time window.
- **Engineering Unit**: `%`
- **Bounds**: $[0\%, 100\%]$
- **Tooltip Definition**: *"Ratio of accepted defect-free die/wafers to total inspected wafers completing final stage metrology."*

---

### 1.4. Defect Rate ($DR$)
- **Formula**:
  $$DR = \left(\frac{\text{Defective Wafers}}{\text{Total Inspected Wafers}}\right) \times 100\% = 100\% - Y$$
- **Numerator**: Defect count or scrapped units.
- **Denominator**: Total inspected units in the lot or bay.
- **Engineering Unit**: `%`
- **Tooltip Definition**: *"Proportion of manufactured wafers rejected due to surface scratches, particulate contamination, or out-of-spec metrology."*

---

### 1.5. Fab Throughput ($TH$)
- **Formula**:
  $$TH = \frac{\text{Total Wafers Processed}}{\text{Operating Hours} \times \text{Tool Count}}$$
- **Numerator**: Total wafers completing processing.
- **Denominator**: Total elapsed operating hours multiplied by active equipment count.
- **Engineering Unit**: `wafers/hour/tool`
- **Tooltip Definition**: *"Average hourly wafer processing velocity per fabrication tool across the selected window."*

---

## 2. Statistical Process Control (SPC) & Process Capability

Control limits in Semimatrix are computed from a **user-selectable Phase I baseline window** (not from the data currently being judged).

### 2.1. Individuals & Moving Range ($I\text{-}MR$)
- **Centerline ($\bar{X}$)**:
  $$\bar{X} = \frac{1}{N}\sum_{i=1}^{N} X_i$$
- **Average Moving Range ($\overline{MR}$)**:
  $$\overline{MR} = \frac{1}{N-1}\sum_{i=2}^{N} |X_i - X_{i-1}|$$
- **Estimated Standard Deviation ($\hat{\sigma}$)**:
  $$\hat{\sigma} = \frac{\overline{MR}}{d_2} \quad \text{where } d_2 = 1.128 \text{ for } n=2$$
- **Upper Control Limit ($UCL$)**:
  $$UCL = \bar{X} + 3\hat{\sigma} = \bar{X} + 2.66 \times \overline{MR}$$
- **Lower Control Limit ($LCL$)**:
  $$LCL = \bar{X} - 3\hat{\sigma} = \bar{X} - 2.66 \times \overline{MR}$$

---

### 2.2. Nelson & Western Electric Control Rules
Semimatrix deterministically tests for out-of-control conditions:
1. **Rule 1 (Gross Outlier)**: 1 point falls beyond 3-sigma limits ($> UCL$ or $< LCL$).
2. **Rule 2 (Process Shift)**: 9 consecutive points fall on the same side of the centerline.
3. **Rule 3 (Drift / Degradation)**: 6 consecutive points steadily increasing or decreasing.
4. **Rule 4 (Systematic Mixture)**: 14 consecutive points alternating up and down.

---

### 2.3. Process Capability Indices ($C_p, C_{pk}$)
*Calculated only when explicit engineering upper and lower specification limits (USL, LSL) are defined in the equipment catalogue.*

- **Potential Capability ($C_p$)**:
  $$C_p = \frac{\text{USL} - \text{LSL}}{6\hat{\sigma}}$$
  *Denominator*: Six standard deviations ($6\sigma$) of baseline process spread.
- **Demonstrated Capability ($C_{pk}$)**:
  $$C_{pk} = \min\left(\frac{\text{USL} - \bar{X}}{3\hat{\sigma}}, \frac{\bar{X} - \text{LSL}}{3\hat{\sigma}}\right)$$
  *Denominator*: Three standard deviations ($3\sigma$) to the nearest specification threshold.
