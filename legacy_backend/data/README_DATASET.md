# Synthetic Dataset for FABSENSE

This folder contains the synthetic datasets generated for the FABSENSE machine learning models. The data is generated using a latent causal structure to ensure physical correlation and realism.

## failure_data.csv (Predictive Maintenance)
Target: `failure_within_7_days`
- `machine_id`: ID of the equipment
- `process_type`: Process category (ETCH, DEPOSITION, etc.)
- `age_months`: Age of the machine in months
- `vibration`: Vibration reading (correlates with degradation)
- `temperature`: Temperature reading
- `error_count`: Errors thrown during cycles
- `cycle_time`: Time taken per cycle (increases with wear)
- `pressure`: Operating pressure
- `hours_since_maintenance_norm`: Normalized hours since last maintenance
- `prior_failures`: Count of prior historical failures

## defect_data.csv (Defect Prediction)
Target: `defect`
- `stage`: Process stage name
- `temp_deviation`: Absolute deviation from recipe setpoint
- `pressure_deviation`: Pressure deviation from nominal
- `duration_deviation`: Deviation in stage duration
- `machine_health`: Computed health score of the machine
- `utilization`: Machine utilization percentage

## yield_data.csv (Yield Regression)
Target: `batch_yield`
- `avg_health`: Average health of machines processing the batch
- `process_dev_count`: Number of process deviations encountered
- `defect_density`: Density of defects (exponentially distributed)
