from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Batch, Wafer, DefectRecord, ProcessStage, Equipment

router = APIRouter(prefix="/yield", tags=["yield"])

@router.get("/summary")
def get_yield_summary(
    date_range: Optional[str] = Query("7d"),
    lot_id: Optional[str] = Query(None),
    stage_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    total_wafers_inspected = 12740
    good_wafers = 12450
    defective_wafers = total_wafers_inspected - good_wafers
    overall_yield_pct = round((good_wafers / total_wafers_inspected) * 100, 2)
    predicted_next_lot_yield = 97.45
    yield_delta = +0.62 # vs last 7 days

    return {
        "overall_yield_pct": overall_yield_pct,
        "total_inspected": total_wafers_inspected,
        "good_wafers": good_wafers,
        "defective_wafers": defective_wafers,
        "predicted_yield_pct": predicted_next_lot_yield,
        "yield_delta_pct": yield_delta,
        "formula": {
            "definition": "Wafer yield = (Number of good wafers or dies ÷ Total inspected wafers or dies) × 100",
            "numerator": good_wafers,
            "denominator": total_wafers_inspected,
            "result_str": f"({good_wafers:,} ÷ {total_wafers_inspected:,}) × 100 = {overall_yield_pct}%"
        },
        "target_yield_pct": 98.0,
        "downtime_risk_hours": 14.5
    }

@router.get("/trend")
def get_yield_trend(
    timeframe: Optional[str] = Query("7d"),
    db: Session = Depends(get_db)
):
    # Historical vs Predicted Yield over last 7 days or lots
    data = [
        {"period": "Day 1", "date": "2026-10-08", "actual_yield": 95.8, "predicted_yield": 96.1, "target": 97.5, "wafers": 1820},
        {"period": "Day 2", "date": "2026-10-09", "actual_yield": 96.4, "predicted_yield": 96.3, "target": 97.5, "wafers": 1850},
        {"period": "Day 3", "date": "2026-10-10", "actual_yield": 94.9, "predicted_yield": 95.2, "target": 97.5, "wafers": 1790},
        {"period": "Day 4", "date": "2026-10-11", "actual_yield": 97.1, "predicted_yield": 96.9, "target": 97.5, "wafers": 1840},
        {"period": "Day 5", "date": "2026-10-12", "actual_yield": 97.8, "predicted_yield": 97.6, "target": 97.5, "wafers": 1880},
        {"period": "Day 6", "date": "2026-10-13", "actual_yield": 98.2, "predicted_yield": 98.0, "target": 97.5, "wafers": 1810},
        {"period": "Day 7 (Today)", "date": "2026-10-14", "actual_yield": 97.7, "predicted_yield": 97.8, "target": 97.5, "wafers": 1750},
    ]
    return data

@router.get("/pareto")
def get_defect_pareto():
    # Defect distribution by defect category with count, percentage, and cumulative share
    defects = [
        {"type": "Sub-Micron Particles", "count": 138, "pct": 47.6, "cumulative": 47.6, "severity": "HIGH", "likely_source": "Cleanroom air filtration & load-lock transfer"},
        {"type": "Pattern Distortion", "count": 64, "pct": 22.1, "cumulative": 69.7, "severity": "HIGH", "likely_source": "Photolithography reticle focus drift / tilt"},
        {"type": "Edge Bevel Scratches", "count": 42, "pct": 14.5, "cumulative": 84.2, "severity": "MEDIUM", "likely_source": "End-effector robotic wafer handling friction"},
        {"type": "CMP Over-Polish / Thinning", "count": 28, "pct": 9.7, "cumulative": 93.9, "severity": "MEDIUM", "likely_source": "Slurry delivery non-uniformity across 300mm wafer"},
        {"type": "Residual Under-Etch", "count": 18, "pct": 6.1, "cumulative": 100.0, "severity": "LOW", "likely_source": "RF bias power drop in chamber peripheral zone"}
    ]
    return defects

@router.get("/stages")
def get_stage_comparisons():
    # Cross-stage and equipment yield performance
    stages = [
        {"stage": "Photolithography", "yield_pct": 98.9, "wafers_tested": 12740, "defects_detected": 64, "cycle_time_min": 45.2, "risk": "Low"},
        {"stage": "Plasma Etching", "yield_pct": 96.4, "wafers_tested": 12676, "defects_detected": 156, "cycle_time_min": 62.8, "risk": "High"},
        {"stage": "Chemical Vapor Depo (CVD)", "yield_pct": 98.1, "wafers_tested": 12520, "defects_detected": 42, "cycle_time_min": 85.0, "risk": "Medium"},
        {"stage": "Chemical Mech Planar (CMP)", "yield_pct": 97.5, "wafers_tested": 12478, "defects_detected": 28, "cycle_time_min": 38.4, "risk": "Medium"},
        {"stage": "Ion Implantation", "yield_pct": 99.4, "wafers_tested": 12450, "defects_detected": 8, "cycle_time_min": 52.1, "risk": "Low"}
    ]
    return stages

@router.get("/correlations")
def get_parameter_correlations():
    # Process parameter trends associated with yield loss
    return [
        {
            "parameter": "Chamber Pressure Drift",
            "stage": "Plasma Etching",
            "correlation": -0.84,
            "status": "Strong Adverse Correlation",
            "description": "Pressure rising above 3.0 Torr correlates with a 3.8% drop in wafer edge yield due to plasma non-uniformity.",
            "recommended_window": "1.80 - 2.40 Torr"
        },
        {
            "parameter": "Pedestal RF Bias Harmonic Distortion",
            "stage": "Plasma Etching",
            "correlation": -0.72,
            "status": "Adverse Correlation",
            "description": "High reflection coefficient power spikes cause micro-arcing and particle creation.",
            "recommended_window": "< 3.5% Reflected Power"
        },
        {
            "parameter": "CMP Slurry Flow Rate",
            "stage": "CMP Planarization",
            "correlation": 0.65,
            "status": "Positive Correlation",
            "description": "Maintaining stable 200 mL/min slurry flow minimizes pad glazing and scratch defects.",
            "recommended_window": "190 - 210 mL/min"
        },
        {
            "parameter": "Showerhead Pre-Heat Temp",
            "stage": "CVD Deposition",
            "correlation": -0.58,
            "status": "Moderate Adverse Correlation",
            "description": "Thermal gradients above 8°C across showerhead cause film thickness variations.",
            "recommended_window": "148 - 153 °C"
        }
    ]

@router.get("/lots")
def get_lot_history():
    return [
        {"lot_id": "LOT-2026-104", "product": "5nm FinFET Logic", "wafers": 25, "good": 24, "yield_pct": 96.0, "status": "COMPLETED", "date": "2026-10-14"},
        {"lot_id": "LOT-2026-103", "product": "3nm Gate-All-Around", "wafers": 25, "good": 25, "yield_pct": 100.0, "status": "COMPLETED", "date": "2026-10-13"},
        {"lot_id": "LOT-2026-102", "product": "High-Density 3D NAND", "wafers": 25, "good": 23, "yield_pct": 92.0, "status": "ATTENTION_NEEDED", "date": "2026-10-12"},
        {"lot_id": "LOT-2026-101", "product": "5nm FinFET Logic", "wafers": 25, "good": 24, "yield_pct": 96.0, "status": "COMPLETED", "date": "2026-10-11"},
        {"lot_id": "LOT-2026-100", "product": "Power MOSFET Array", "wafers": 25, "good": 25, "yield_pct": 100.0, "status": "COMPLETED", "date": "2026-10-10"}
    ]
