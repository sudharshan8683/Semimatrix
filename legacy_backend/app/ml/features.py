import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor, IsolationForest

def get_failure_feature_pipeline():
    # Numeric features used for failure prediction
    numeric_features = [
        "age_months", "vibration", "temperature", 
        "error_count", "cycle_time", "pressure", 
        "hours_since_maintenance_norm", "prior_failures"
    ]
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features)
        ], remainder='drop')
    return preprocessor, numeric_features

def get_defect_feature_pipeline():
    numeric_features = [
        "temp_deviation", "pressure_deviation", 
        "duration_deviation", "machine_health", "utilization"
    ]
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features)
        ], remainder='drop')
    return preprocessor, numeric_features

def get_yield_feature_pipeline():
    numeric_features = ["avg_health", "process_dev_count", "defect_density"]
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features)
        ], remainder='drop')
    return preprocessor, numeric_features
