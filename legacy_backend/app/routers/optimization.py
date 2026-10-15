from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/optimization", tags=["optimization"])

class ParameterSetting(BaseModel):
    name: str
    key: str
    current_value: float
    recommended_value: float
    min_safe: float
    max_safe: float
    unit: str
    impact_level: str # HIGH, MEDIUM, LOW
    is_yield_detractor: bool
    explanation: str

class OptimizationScenarioRequest(BaseModel):
    equipment_id: str
    process_stage: str
    parameter_adjustments: Dict[str, float] # { "rf_bias_power": 450.0, ... }

RECIPES = {
    "ETCH-02": {
        "equipment_name": "Plasma Etcher Chamber B",
        "stage": "Plasma Etching",
        "current_yield": 94.2,
        "current_risk": "High",
        "parameters": [
            {
                "name": "RF Bias Power",
                "key": "rf_bias_power",
                "current_value": 520.0,
                "recommended_value": 460.0,
                "min_safe": 400.0,
                "max_safe": 550.0,
                "unit": "Watts",
                "impact_level": "HIGH",
                "is_yield_detractor": True,
                "explanation": "High bias power is inducing micro-trenching and edge over-etch defects."
            },
            {
                "name": "Chamber Operating Pressure",
                "key": "chamber_pressure",
                "current_value": 3.42,
                "recommended_value": 2.15,
                "min_safe": 1.50,
                "max_safe": 2.80,
                "unit": "Torr",
                "impact_level": "HIGH",
                "is_yield_detractor": True,
                "explanation": "Exhaust pressure exceeding 2.80 Torr causes plasma sheath turbulence."
            },
            {
                "name": "Gas Ratio (Cl2 / BCl3)",
                "key": "gas_ratio",
                "current_value": 1.85,
                "recommended_value": 2.40,
                "min_safe": 1.80,
                "max_safe": 3.00,
                "unit": "Ratio",
                "impact_level": "MEDIUM",
                "is_yield_detractor": False,
                "explanation": "Optimizing chemical radical flux improves anisotropic etch selectivity."
            },
            {
                "name": "Electrostatic Chuck Temp",
                "key": "chuck_temp",
                "current_value": 68.0,
                "recommended_value": 62.0,
                "min_safe": 50.0,
                "max_safe": 75.0,
                "unit": "°C",
                "impact_level": "MEDIUM",
                "is_yield_detractor": False,
                "explanation": "Lower chuck temperature prevents photoresist thermal reflow at periphery."
            },
            {
                "name": "Over-Etch Duration",
                "key": "over_etch_time",
                "current_value": 18.0,
                "recommended_value": 12.0,
                "min_safe": 8.0,
                "max_safe": 25.0,
                "unit": "seconds",
                "impact_level": "LOW",
                "is_yield_detractor": False,
                "explanation": "Excessive over-etch degrades underlying gate oxide barrier."
            }
        ]
    },
    "DEPO-04": {
        "equipment_name": "CVD Precursor Tool 4",
        "stage": "Chemical Vapor Deposition (CVD)",
        "current_yield": 95.8,
        "current_risk": "Medium",
        "parameters": [
            {
                "name": "Showerhead Temperature",
                "key": "showerhead_temp",
                "current_value": 168.0,
                "recommended_value": 150.0,
                "min_safe": 140.0,
                "max_safe": 160.0,
                "unit": "°C",
                "impact_level": "HIGH",
                "is_yield_detractor": True,
                "explanation": "Overheating leads to premature precursor gas breakdown on showerhead face."
            },
            {
                "name": "Silane (SiH4) Flow",
                "key": "silane_flow",
                "current_value": 142.0,
                "recommended_value": 135.0,
                "min_safe": 120.0,
                "max_safe": 150.0,
                "unit": "sccm",
                "impact_level": "MEDIUM",
                "is_yield_detractor": False,
                "explanation": "Slight reduction produces higher dielectric uniformity across 300mm wafer."
            },
            {
                "name": "Deposition Chamber Vacuum",
                "key": "depo_vacuum",
                "current_value": 0.82,
                "recommended_value": 0.75,
                "min_safe": 0.60,
                "max_safe": 0.90,
                "unit": "Torr",
                "impact_level": "LOW",
                "is_yield_detractor": False,
                "explanation": "Stabilizes boundary layer flow across wafer platen."
            }
        ]
    },
    "LITH-01": {
        "equipment_name": "EUV Photolithography Stepper 1",
        "stage": "Photolithography",
        "current_yield": 96.2,
        "current_risk": "Medium",
        "parameters": [
            {
                "name": "Exposure Dose",
                "key": "exposure_dose",
                "current_value": 24.5,
                "recommended_value": 22.0,
                "min_safe": 18.0,
                "max_safe": 26.0,
                "unit": "mJ/cm²",
                "impact_level": "HIGH",
                "is_yield_detractor": True,
                "explanation": "Over-exposure causing critical dimension (CD) shrinkage on dense line arrays."
            },
            {
                "name": "Numerical Aperture Focus Offset",
                "key": "focus_offset",
                "current_value": 0.08,
                "recommended_value": 0.02,
                "min_safe": -0.05,
                "max_safe": 0.10,
                "unit": "µm",
                "impact_level": "HIGH",
                "is_yield_detractor": True,
                "explanation": "Focus drift inducing pattern blur in peripheral dies."
            }
        ]
    }
}

@router.get("/recipes")
def get_optimization_recipes():
    return {
        "tools": [
            {"id": k, "name": v["equipment_name"], "stage": v["stage"], "current_yield": v["current_yield"], "risk": v["current_risk"]}
            for k, v in RECIPES.items()
        ]
    }

@router.get("/recipe/{tool_id}")
def get_tool_recipe(tool_id: str):
    recipe = RECIPES.get(tool_id.upper())
    if not recipe:
        # Fallback to ETCH-02
        recipe = RECIPES["ETCH-02"]
    return recipe

@router.post("/evaluate")
def evaluate_optimization_scenario(req: OptimizationScenarioRequest):
    base = RECIPES.get(req.equipment_id.upper(), RECIPES["ETCH-02"])
    
    # Calculate simulated yield improvement based on proximity to recommended parameters
    total_gain = 0.0
    changed_params = []
    
    for p in base["parameters"]:
        key = p["key"]
        curr = p["current_value"]
        target = p["recommended_value"]
        proposed = req.parameter_adjustments.get(key, curr)
        
        # Check how much closer proposed is to target
        distance_orig = abs(curr - target)
        distance_new = abs(proposed - target)
        
        if abs(proposed - curr) > 0.001:
            changed_params.append({
                "parameter": p["name"],
                "before": f"{curr} {p['unit']}",
                "after": f"{proposed} {p['unit']}",
                "delta": f"{proposed - curr:+.2f} {p['unit']}"
            })
            
        if distance_orig > 0:
            fraction_fixed = max(0.0, (distance_orig - distance_new) / distance_orig)
            weight = 2.4 if p["impact_level"] == "HIGH" else (1.2 if p["impact_level"] == "MEDIUM" else 0.5)
            total_gain += fraction_fixed * weight

    base_yield = base["current_yield"]
    proposed_yield = min(99.4, round(base_yield + total_gain, 2))
    
    proposed_risk = "Low" if proposed_yield >= 97.5 else ("Medium" if proposed_yield >= 95.0 else "High")
    
    return {
        "equipment_id": req.equipment_id,
        "equipment_name": base["equipment_name"],
        "stage": base["stage"],
        "comparison": {
            "current_predicted_yield_pct": base_yield,
            "proposed_predicted_yield_pct": proposed_yield,
            "yield_delta_pct": round(proposed_yield - base_yield, 2),
            "current_risk_level": base["current_risk"],
            "proposed_risk_level": proposed_risk,
            "good_die_gain_per_wafer": int((proposed_yield - base_yield) * 14.2),
            "estimated_annual_cost_savings": f"${int((proposed_yield - base_yield) * 128000):,}"
        },
        "changed_parameters": changed_params,
        "explanation": (
            f"Advising parameter adjustments on {base['equipment_name']}: Bringing chamber pressure "
            f"and RF power into the optimal process window minimizes boundary layer turbulence and prevents edge over-etch. "
            f"Simulated yield improves from {base_yield}% to {proposed_yield}%."
        ),
        "advisory_notice": (
            "NOTICE: This is an Illustrative Scenario advisory prediction. Semiconductor process recipe "
            "changes must NOT be applied automatically to manufacturing tools and require human-in-the-loop "
            "engineering qualification and sign-off."
        )
    }
