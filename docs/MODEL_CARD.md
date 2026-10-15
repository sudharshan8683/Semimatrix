# Semimatrix Model Card: UCI SECOM Wafer Defect Classifier & Fleet Health Indices

**Model Version**: v1.0.0 (Production Benchmark)  
**Date Evaluated**: October 2026  
**Primary Dataset**: UCI SECOM (Semiconductor Process Dataset)  
**Pipeline Code**: `ml/preprocess.py`, `ml/feature_study.py`, `ml/final_evaluate.py`, `ml/service/main.py`  
**Model Persistence**: `ml/models/final_model.joblib` & `ml/processed/preprocessor.joblib`

---

## 1. Intended Use & Advisory Boundary

- **Primary Intended Use**: Assisting cleanroom yield analysis engineers in screening multi-sensor wafer vectors and highlighting anomalous channel clusters.
- **Out-of-Scope & Unintended Uses**:
  - Automated closed-loop wafer scrapping or hardware actuation without human review.
  - Predicting catastrophic tool breakdown from sensor-only vectors lacking maintenance labels.
- **Safety Boundary**: Semimatrix is strictly advisory. It does not send write commands to equipment or modify recipe setpoints.

---

## 2. Training Data Provenance & Class Imbalance

- **Data Source**: UCI Machine Learning Repository — Semiconductor Manufacturing Process Dataset (`secom.data`).
- **Feature Space**: 590 anonymized sensor channels sampled per wafer run across etch, deposition, and planarization modules.
- **Total Historical Instances**: 1,567 wafer runs.
- **Class Distribution (Severe Imbalance)**:
  - *Normal Wafers (-1)*: 1,463 (93.36%)
  - *Defective Wafers (+1)*: 104 (6.64%)
- **Validation Partitioning (Strict Time-Ordered Split)**:
  - To prevent temporal data leakage and optimistic bias, data was split strictly chronologically (first 80% for training/validation, final 20% reserved as holdout test set). **No random shuffling across time.**
  - *Holdout Test Set Size*: 314 wafer runs.
  - *Holdout True Positives (Fails)*: 17 wafer runs (5.41% positive base rate).

---

## 3. Preprocessing & Feature Selection

1. **Missing Data Imputation**: Median value imputation learned strictly on the training partition (`ml/processed/preprocessor.joblib`).
2. **Standardization**: Mean-zero, unit-variance scaling fitted only on the training set.
3. **Variance Threshold Screening**: 150 non-informative features (zero-variance constant sensors or >50% missing channels) were permanently dropped.
4. **Feature Selection**: Top 50 features selected through Mutual Information and Random Forest Gini importance on cross-validated training folds.

---

## 4. Empirical Evaluation & Honest Benchmark Results

Evaluated on the un-tuned holdout test set (314 samples, 17 true positive defect runs):

| Metric | Holdout Value | Technical Interpretation |
| :--- | :--- | :--- |
| **ROC-AUC** | **0.5506** | Modest discriminative capacity in high-dimensional sensor space. |
| **PR-AUC (Precision-Recall)** | **0.0719** | Realistic performance given the 5.41% positive base rate. Far more informative than misleading accuracy. |
| **Precision at Default Threshold (0.50)** | **0.00%** | Standard 0.50 threshold catches **0 true positives** due to extreme class imbalance. |
| **Recall at Default Threshold (0.50)** | **0.00%** | Baseline models must never be evaluated solely at 0.50 cutoff. |
| **Top 20% Risk Flagging Score** | **11.76% Recall (2/17 caught)** | Flagging the top 20% highest risk scores captures 2 true positive excursions with 3.17% precision (0.59 lift vs random). |

```json
{
  "test_rows": 314,
  "test_positives": 17,
  "roc_auc": 0.5506,
  "pr_auc": 0.0719,
  "precision_at_0.5": 0.0,
  "recall_at_0.5": 0.0,
  "confusion_at_0.5": {
    "tp": 0,
    "fn": 17,
    "fp": 0,
    "tn": 297
  },
  "flag_top_20pct": {
    "rows_flagged": 63,
    "caught": 2,
    "precision": 0.0317,
    "recall": 0.1176,
    "lift_vs_random": 0.59
  }
}
```

> [!IMPORTANT]
> **Scientific Transparency**: Reporting 94.6% "accuracy" on this dataset is dishonest because predicting negative on every wafer yields 94.6% accuracy while catching zero defects. Semimatrix exclusively reports PR-AUC and parameterized recall curves.

---

## 5. Equipment Health Index & Degradation Model

For tool-level equipment telemetry where positive failure labels are sparse ($<10$ instances), Semimatrix enforces a transparent deterministic health index rather than a fake supervised classifier:

$$\text{Health Index} = 100 - (\text{Drift Penalty} + \text{Anomaly Penalty} + \text{SPC Penalty} + \text{PM Age Penalty} + \text{Alarm Penalty})$$

- **Sensor Drift Slope Penalty**: Up to 30 points ($\Delta \text{Param} / \text{Nominal}$).
- **Anomaly Rate Penalty**: Up to 35 points (fraction of readings with $|z| > 2.0$).
- **SPC Violations**: 5 points per active Nelson rule tripwire.
- **PM Age Penalty**: Proportional to elapsed days since last preventative maintenance clean.
- **Failure Risk Probability**: $P(\text{Fail}) = 1.0 - \frac{\text{Health Index}}{100}$.

---

## 6. Known Failure Modes & Limitations

1. **Anonymized Sensor Semantics**: The UCI SECOM dataset strips physical sensor names (e.g., "feature_59" instead of "Chamber Pressure"). Semantic root-cause attribution is limited to relative feature contribution rankings.
2. **Label Scarcity in Telemetry**: If an equipment bay has fewer than 10 confirmed breakdown events, supervised classification is explicitly disabled and labelled as such.
3. **No Remaining Useful Life (RUL) Without Monotonic Run-to-Failure Data**: RUL is not fabricated without calibrated physics-of-failure or run-to-failure degradation curves.
