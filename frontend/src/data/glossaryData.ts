export interface GlossaryEntry {
  term: string;
  category: 'Operations' | 'Statistical Control' | 'Predictive ML' | 'Attribution';
  plainSentence: string;
  formula?: string;
  whatItTellsYou: string;
  whatItCannotTellYou: string;
}

export const GLOSSARY_TERMS: Record<string, GlossaryEntry> = {
  yield: {
    term: 'Wafer Yield',
    category: 'Operations',
    plainSentence: 'The percentage of manufactured silicon die on a wafer that pass functional electrical tests without fatal defects.',
    formula: 'Yield (%) = (Good Units / Total Units) × 100',
    whatItTellsYou: 'Tells you factory production efficiency and the exact proportion of saleable silicon die.',
    whatItCannotTellYou: 'Does not explain which specific equipment stage, chemical contaminant, or particle caused the defective die.'
  },
  defect_rate: {
    term: 'Defect Rate',
    category: 'Operations',
    plainSentence: 'The proportion of fabricated wafers or die that fail inspection criteria and must be discarded as scrap.',
    formula: 'Defect Rate (%) = (Defect Count / Total Units) × 100  [or 100% - Yield %]',
    whatItTellsYou: 'Tells you the magnitude of scrap loss occurring across active cleanroom process stages.',
    whatItCannotTellYou: 'Does not tell you whether defect loss is random spatial noise or clustered tool-induced scratches.'
  },
  availability: {
    term: 'Equipment Availability',
    category: 'Operations',
    plainSentence: 'The fraction of scheduled factory hours that a cleanroom tool is mechanically operational and ready to process wafers.',
    formula: 'Availability = (Scheduled Time - Unscheduled Downtime) / Scheduled Time',
    whatItTellsYou: 'Tells you tool mechanical readiness and how much production time is lost to unexpected breakdowns.',
    whatItCannotTellYou: 'Does not tell you if the tool was actually running production lots or sitting empty waiting for operators.'
  },
  utilization: {
    term: 'Equipment Utilization',
    category: 'Operations',
    plainSentence: 'The fraction of available tool operating time that is actively spent running recipes on silicon wafers.',
    formula: 'Utilization = Productive Recipe Processing Time / Available Operational Time',
    whatItTellsYou: 'Tells you factory scheduling efficiency and whether bottleneck chambers are actively utilized.',
    whatItCannotTellYou: 'Does not tell you if the wafers produced during that processing time met quality specifications.'
  },
  downtime: {
    term: 'Unscheduled Downtime',
    category: 'Operations',
    plainSentence: 'The total duration that an equipment chamber is taken offline unexpectedly due to hardware faults, aborts, or sensor failures.',
    formula: 'Unscheduled Downtime (hrs) = Sum of all unexpected tool fault intervals',
    whatItTellsYou: 'Quantifies operational disruption and repair delays outside of planned preventive maintenance.',
    whatItCannotTellYou: 'Does not predict when the next unrelated component breakdown will occur.'
  },
  throughput: {
    term: 'Throughput',
    category: 'Operations',
    plainSentence: 'The rate at which a cleanroom tool completes wafer lots per unit of time, typically expressed in wafers per hour (wph).',
    formula: 'Throughput (wph) = Total Wafers Processed / Active Chamber Operating Hours',
    whatItTellsYou: 'Tells you tool processing velocity and factory production line capacity.',
    whatItCannotTellYou: 'Does not reflect wafer yield; a tool running high throughput can still produce defective scrap.'
  },
  spc: {
    term: 'Statistical Process Control (SPC)',
    category: 'Statistical Control',
    plainSentence: 'A mathematical methodology that monitors process stability over time using statistical boundaries to distinguish normal variation from abnormal excursions.',
    formula: 'Individual Shewhart I-Chart with Moving Range (MR)',
    whatItTellsYou: 'Tells you whether parameter deviations stem from natural common-cause noise or an abnormal special-cause fault.',
    whatItCannotTellYou: 'Does not inherently know the physical cause (e.g., whether a temperature rise is due to heater coil aging or gas flow imbalance).'
  },
  control_limits: {
    term: 'Control Limits (UCL / LCL)',
    category: 'Statistical Control',
    plainSentence: 'Statistical thresholds (Center Line ± 3 standard deviations) computed strictly from an established Phase I baseline of normal operation.',
    formula: 'UCL = X̄ + 2.66 × MR̄   |   LCL = X̄ - 2.66 × MR̄   (where MR̄ is mean moving range)',
    whatItTellsYou: 'Defines the expected bounds of natural process variation for a cleanroom tool in statistical control.',
    whatItCannotTellYou: 'Control limits are NOT customer specification limits (USL/LSL); a tool can be in control yet produce out-of-spec wafers if improperly calibrated.'
  },
  cp_cpk: {
    term: 'Process Capability Indices (Cp / Cpk)',
    category: 'Statistical Control',
    plainSentence: 'Ratios comparing allowable engineering specification tolerance against the actual statistical spread and centering of the tool.',
    formula: 'Cp = (USL - LSL) / 6σ   |   Cpk = min((USL - X̄) / 3σ, (X̄ - LSL) / 3σ)',
    whatItTellsYou: 'Tells you if the tool is capable of consistently staying within tolerance (Cpk ≥ 1.33 is industry standard).',
    whatItCannotTellYou: 'Cannot be calculated without engineering specification limits (USL and LSL).'
  },
  anomaly_score: {
    term: 'Sensor Anomaly Score',
    category: 'Predictive ML',
    plainSentence: 'A normalized score (0–100%) reflecting how far a real-time sensor reading deviates from multidimensional historical patterns.',
    formula: 'Isolation Forest path length anomaly metric combined with rolling robust z-scores',
    whatItTellsYou: 'Highlights unusual chamber behaviors across multiple correlated sensors before single-sensor thresholds are breached.',
    whatItCannotTellYou: 'An anomaly score does not guarantee imminent hardware failure; benign recipe changes or new gas batches can trigger temporary spikes.'
  },
  maintenance_risk: {
    term: 'Maintenance Risk Score',
    category: 'Predictive ML',
    plainSentence: 'A transparent composite health risk (0–100%) indicating how urgently a tool requires preventive maintenance intervention.',
    formula: 'Risk = 0.35(Drift Slope) + 0.25(Anomaly Rate) + 0.25(Nelson Violations) + 0.15(Interval Since PM)',
    whatItTellsYou: 'Ranks which cleanroom chambers should be prioritized for maintenance before unplanned downtime occurs.',
    whatItCannotTellYou: 'Does not state an exact time-to-failure countdown (RUL) unless run-to-failure degradation curves exist.'
  },
  correlation_vs_causation: {
    term: 'Correlation vs. Causation',
    category: 'Attribution',
    plainSentence: 'Statistical association indicates that two events occurred together, but does not prove that one caused the other.',
    formula: 'Cohen\'s d = (Mean_excursion - Mean_baseline) / Pooled_Standard_Deviation',
    whatItTellsYou: 'Quantifies the strength and sample size of parameter deviations associated with low-yield wafer lots.',
    whatItCannotTellYou: 'Never proves root cause; physical cleanroom inspection, nozzle verification, or sacrificial test wafers are required for verification.'
  },
  confidence_label: {
    term: 'Confidence Label (Low / Med / High)',
    category: 'Attribution',
    plainSentence: 'A qualitative metric rating the statistical reliability of a diagnostic finding based on sample size and deviation consistency.',
    formula: 'High: N ≥ 20 and |d| ≥ 1.5   |   Medium: N ≥ 10 and |d| ≥ 0.8   |   Low: N < 10 or small effect size',
    whatItTellsYou: 'Prevents engineers from overreacting to small-sample noise or transient single-wafer fluctuations.',
    whatItCannotTellYou: 'High statistical confidence does not eliminate the possibility of unmeasured confounding variables upstream.'
  }
};
