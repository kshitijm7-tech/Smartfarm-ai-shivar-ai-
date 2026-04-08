"""
Tool wrappers for the SmartFarm OpenEnv Environment.

These functions wrap the existing SmartFarm backend pipelines
(soil analysis, crop recommendation, risk assessment, disease detection)
into clean tool interfaces that the environment can dispatch to.

All tools are self-contained — they import and re-implement the core logic
from SmartFarm's ai_interface.py so the environment package is portable.
"""

import json
import math
import os
from typing import Any, Dict, Optional


# ══════════════════════════════════════════════════════════════════════
#  Coordinate-seeded helpers (ported from ai_interface.py)
# ══════════════════════════════════════════════════════════════════════

def _coord_seed(lat: float, lon: float) -> float:
    """Return a value in [0, 1) deterministically derived from lat/lon."""
    raw = abs(math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453)
    return raw - int(raw)


def _lerp(low: float, high: float, t: float) -> float:
    """Linear interpolation between low and high by factor t ∈ [0,1]."""
    return low + (high - low) * t


# ══════════════════════════════════════════════════════════════════════
#  Region Profiles (ported from ai_interface.py)
# ══════════════════════════════════════════════════════════════════════

REGION_PROFILES: Dict[str, Dict[str, Any]] = {
    "pune_deccan": {
        "label": "Pune / Deccan Plateau",
        "lat_range": (17.0, 20.0), "lon_range": (73.0, 76.0),
        "soil_type": "Black Cotton (Vertisol)",
        "clay_pct": 55,
        "ph_range": (7.8, 8.3),
        "soil_temp_range": (24.0, 28.0),
        "soil_moisture_range": (35, 55),
        "organic_carbon_range": (0.5, 1.2),
        "water_holding_capacity": "High",
        "nitrogen_range": (30, 60),
        "phosphorus_range": (10, 30),
        "potassium_range": (180, 280),
    },
    "nashik_mh": {
        "label": "Nashik / North Maharashtra",
        "lat_range": (19.0, 21.0), "lon_range": (73.0, 74.5),
        "soil_type": "Red Laterite",
        "clay_pct": 30,
        "ph_range": (6.0, 6.8),
        "soil_temp_range": (22.0, 26.0),
        "soil_moisture_range": (30, 50),
        "organic_carbon_range": (0.8, 1.5),
        "water_holding_capacity": "Low-Medium",
        "nitrogen_range": (25, 55),
        "phosphorus_range": (8, 25),
        "potassium_range": (80, 160),
    },
    "punjab": {
        "label": "Punjab / North-West India",
        "lat_range": (30.0, 32.5), "lon_range": (74.0, 76.5),
        "soil_type": "Rich Alluvial",
        "clay_pct": 28,
        "ph_range": (7.2, 7.8),
        "soil_temp_range": (18.0, 24.0),
        "soil_moisture_range": (45, 70),
        "organic_carbon_range": (1.5, 2.8),
        "water_holding_capacity": "High",
        "nitrogen_range": (60, 100),
        "phosphorus_range": (25, 50),
        "potassium_range": (120, 220),
    },
    "delhi_igp": {
        "label": "Delhi / Indo-Gangetic Plain",
        "lat_range": (28.0, 30.0), "lon_range": (76.0, 78.0),
        "soil_type": "Alluvial (Sandy Loam)",
        "clay_pct": 22,
        "ph_range": (7.0, 7.5),
        "soil_temp_range": (20.0, 26.0),
        "soil_moisture_range": (40, 65),
        "organic_carbon_range": (1.0, 2.0),
        "water_holding_capacity": "Medium",
        "nitrogen_range": (50, 90),
        "phosphorus_range": (20, 45),
        "potassium_range": (100, 200),
    },
    "coastal_karnataka": {
        "label": "Coastal Karnataka / Konkan",
        "lat_range": (12.0, 16.0), "lon_range": (74.0, 76.0),
        "soil_type": "Laterite (Red / Coastal)",
        "clay_pct": 35,
        "ph_range": (5.5, 6.5),
        "soil_temp_range": (26.0, 30.0),
        "soil_moisture_range": (55, 80),
        "organic_carbon_range": (1.2, 2.5),
        "water_holding_capacity": "Medium",
        "nitrogen_range": (35, 70),
        "phosphorus_range": (12, 35),
        "potassium_range": (90, 170),
    },
}

GENERIC_PROFILE: Dict[str, Any] = {
    "label": "Generic / Unrecognized Region",
    "soil_type": "Medium Loam",
    "clay_pct": 30,
    "ph_range": (6.5, 7.5),
    "soil_temp_range": (22.0, 28.0),
    "soil_moisture_range": (35, 60),
    "organic_carbon_range": (1.0, 2.0),
    "water_holding_capacity": "Medium",
    "nitrogen_range": (40, 80),
    "phosphorus_range": (15, 40),
    "potassium_range": (100, 200),
}


def _match_region(lat: float, lon: float) -> Dict[str, Any]:
    """Find the matching region profile by bounding box."""
    for profile in REGION_PROFILES.values():
        lat_lo, lat_hi = profile["lat_range"]
        lon_lo, lon_hi = profile["lon_range"]
        if lat_lo <= lat <= lat_hi and lon_lo <= lon <= lon_hi:
            return profile
    return GENERIC_PROFILE


# ══════════════════════════════════════════════════════════════════════
#  Tool 1: Soil Analysis
# ══════════════════════════════════════════════════════════════════════

def tool_analyze_soil(lat: float, lon: float) -> Dict[str, Any]:
    """
    Analyze soil health at given coordinates.

    Returns NPK values, pH, moisture, health score, and soil type.
    Deterministic — same coordinates always produce the same result.
    """
    if not (-90 <= lat <= 90):
        return {"error": f"Invalid latitude: {lat}. Must be between -90 and 90."}
    if not (-180 <= lon <= 180):
        return {"error": f"Invalid longitude: {lon}. Must be between -180 and 180."}

    profile = _match_region(lat, lon)
    t = _coord_seed(lat, lon)
    t2 = _coord_seed(lat * 1.1, lon * 0.9)
    t3 = _coord_seed(lat * 0.9, lon * 1.1)

    nitrogen = round(_lerp(*profile["nitrogen_range"], t))
    phosphorus = round(_lerp(*profile["phosphorus_range"], t2))
    potassium = round(_lerp(*profile["potassium_range"], t3))
    ph = round(_lerp(*profile["ph_range"], _coord_seed(lat + lon, lon - lat)), 1)
    moisture = round(_lerp(*profile["soil_moisture_range"], t2))
    organic_carbon = round(_lerp(*profile["organic_carbon_range"], t2), 1)

    # NDVI score
    seed_value = abs((lat * 1000 + lon * 500) % 100) / 100.0
    ndvi = round(min(max(seed_value, 0.10), 0.92), 2)

    # Health score
    health_score = int(ndvi * 60) + int((nitrogen / 100) * 20) + int((phosphorus / 50) * 20)
    health_score = min(health_score, 100)

    if health_score >= 70:
        status = "Good"
    elif health_score >= 40:
        status = "Moderate"
    else:
        status = "Poor"

    return {
        "nitrogen": nitrogen,
        "phosphorus": phosphorus,
        "potassium": potassium,
        "ph": ph,
        "moisture_percent": moisture,
        "organic_carbon": organic_carbon,
        "ndvi_score": ndvi,
        "health_score": health_score,
        "status": status,
        "soil_type": profile["soil_type"],
        "region": profile["label"],
        "water_holding_capacity": profile["water_holding_capacity"],
        "coordinates": {"lat": lat, "lon": lon},
    }


# ══════════════════════════════════════════════════════════════════════
#  Tool 2: Disease Check
# ══════════════════════════════════════════════════════════════════════

_DISEASE_DATABASE = {
    "wheat": {
        "disease_name": "Rust Fungus (Puccinia)",
        "risk_level": "Medium",
        "severity": "Moderate",
        "symptoms": "Orange-brown pustules on leaves and stems",
        "prevention": "Apply Propiconazole 25% EC at 1 ml/L water as preventive spray",
        "season_risk": {"Rabi": "High", "Kharif": "Low"},
    },
    "rice": {
        "disease_name": "Blast Disease (Magnaporthe)",
        "risk_level": "High",
        "severity": "High",
        "symptoms": "Diamond-shaped lesions on leaves, neck rot",
        "prevention": "Use resistant varieties. Apply Tricyclazole 75% WP at 0.6 g/L",
        "season_risk": {"Rabi": "Low", "Kharif": "High"},
    },
    "maize": {
        "disease_name": "Fall Armyworm",
        "risk_level": "High",
        "severity": "High",
        "symptoms": "Ragged feeding damage on leaves, frass in whorl",
        "prevention": "Apply Emamectin Benzoate 5% SG at 0.4 g/L. Scout fields weekly",
        "season_risk": {"Rabi": "Medium", "Kharif": "High"},
    },
    "soybean": {
        "disease_name": "Yellow Mosaic Virus",
        "risk_level": "Medium",
        "severity": "Moderate",
        "symptoms": "Yellow patches on leaves, stunted growth",
        "prevention": "Control whitefly vectors. Use resistant varieties like JS 335",
        "season_risk": {"Rabi": "Low", "Kharif": "High"},
    },
    "tomato": {
        "disease_name": "Late Blight (Phytophthora)",
        "risk_level": "High",
        "severity": "High",
        "symptoms": "Water-soaked lesions on leaves, white mold underneath",
        "prevention": "Apply Mancozeb 75% WP at 2.5 g/L. Avoid overhead irrigation",
        "season_risk": {"Rabi": "High", "Kharif": "Medium"},
    },
    "cotton": {
        "disease_name": "Bollworm Complex",
        "risk_level": "High",
        "severity": "High",
        "symptoms": "Bored bolls, frass, damaged squares",
        "prevention": "Use Bt cotton varieties. Apply Spinosad 45% SC for heavy infestation",
        "season_risk": {"Rabi": "Low", "Kharif": "High"},
    },
    "sugarcane": {
        "disease_name": "Red Rot (Colletotrichum)",
        "risk_level": "Medium",
        "severity": "Moderate",
        "symptoms": "Red discoloration of internal tissue, white patches",
        "prevention": "Use disease-free seed cane. Treat with Carbendazim before planting",
        "season_risk": {"Rabi": "Medium", "Kharif": "Medium"},
    },
    "onion": {
        "disease_name": "Purple Blotch (Alternaria)",
        "risk_level": "Medium",
        "severity": "Moderate",
        "symptoms": "Purple lesions on leaves with concentric rings",
        "prevention": "Apply Mancozeb + Metalaxyl. Ensure proper drainage",
        "season_risk": {"Rabi": "High", "Kharif": "Medium"},
    },
    "mustard": {
        "disease_name": "White Rust (Albugo)",
        "risk_level": "Medium",
        "severity": "Moderate",
        "symptoms": "White pustules on undersides of leaves",
        "prevention": "Spray Metalaxyl 35% WS. Use resistant varieties",
        "season_risk": {"Rabi": "High", "Kharif": "Low"},
    },
}

_DEFAULT_DISEASE = {
    "disease_name": "General Fungal Risk",
    "risk_level": "Low",
    "severity": "Low",
    "symptoms": "Spots or discoloration on leaves",
    "prevention": "Apply broad-spectrum fungicide. Maintain crop hygiene",
    "season_risk": {"Rabi": "Low", "Kharif": "Low"},
}


def tool_check_disease(crop_name: str, season: str = "Kharif") -> Dict[str, Any]:
    """
    Check disease risk for a given crop.

    Returns disease information including name, risk level, symptoms,
    and prevention measures. Deterministic based on crop name.
    """
    crop_key = crop_name.lower().strip()
    disease_info = _DISEASE_DATABASE.get(crop_key, _DEFAULT_DISEASE)

    season_risk = disease_info["season_risk"].get(season, "Medium")

    return {
        "crop": crop_name,
        "disease_name": disease_info["disease_name"],
        "risk_level": disease_info["risk_level"],
        "severity": disease_info["severity"],
        "symptoms": disease_info["symptoms"],
        "prevention": disease_info["prevention"],
        "season_specific_risk": season_risk,
        "season": season,
    }


# ══════════════════════════════════════════════════════════════════════
#  Tool 3: Crop Recommendation
# ══════════════════════════════════════════════════════════════════════

def _load_crop_database() -> list:
    """Load the crop database JSON file."""
    db_path = os.path.join(os.path.dirname(__file__), "data", "crop_database.json")
    if not os.path.exists(db_path):
        return []
    with open(db_path, "r", encoding="utf-8") as f:
        return json.load(f)


def tool_recommend_crop(
    lat: float,
    lon: float,
    season: str = "Kharif",
    budget: float = 40000,
) -> Dict[str, Any]:
    """
    Recommend crops for given coordinates and constraints.

    Uses soil analysis + crop database scoring to find the best matches.
    Returns top 3 Indian and top 3 foreign crop recommendations.
    """
    soil = tool_analyze_soil(lat, lon)
    if "error" in soil:
        return soil

    N = soil["nitrogen"]
    P = soil["phosphorus"]
    K = soil["potassium"]
    ph = soil["ph"]
    temp = soil.get("moisture_percent", 50) * 0.5 + 10  # heuristic temp
    hum = soil["moisture_percent"]

    all_crops = _load_crop_database()
    if not all_crops:
        # Fallback if no database
        return {
            "top_recommendation": {
                "name": "Wheat",
                "confidence": 75,
                "reason": "Well-suited for the region's soil and climate",
            },
            "indian_crops": [
                {"name": "Wheat", "confidence": 75, "icon": "🌾"},
            ],
            "foreign_crops": [],
            "soil_summary": {
                "nitrogen": N, "phosphorus": P, "potassium": K, "ph": ph,
            },
            "data_source": "fallback",
        }

    def score_crop(crop):
        gp = crop["growth_params"]
        score = 0
        if gp["temp_range"][0] <= temp <= gp["temp_range"][1]:
            score += 20
        if gp["humidity_range"][0] <= hum <= gp["humidity_range"][1]:
            score += 20
        if gp["ph_range"][0] <= ph <= gp["ph_range"][1]:
            score += 20
        if abs(gp["rainfall_mm"] - hum * 15) / max(gp["rainfall_mm"], 1) < 0.3:
            score += 20
        pref = gp["npk_preferred"]
        npk_diff = (abs(pref[0] - N) + abs(pref[1] - P) + abs(pref[2] - K)) / 3
        score += max(0, 20 - (npk_diff / 10))
        return round(min(score, 100))

    indian, foreign = [], []
    for c in all_crops:
        s = score_crop(c)
        if s > 40:
            entry = {
                "name": c["name_en"],
                "confidence": s,
                "icon": c["icon"],
                "origin": c["origin"],
                "water_requirement": (
                    "High" if c["growth_params"]["rainfall_mm"] > 1000
                    else ("Low" if c["growth_params"]["rainfall_mm"] < 500 else "Medium")
                ),
            }
            if c["is_indian"]:
                indian.append(entry)
            else:
                foreign.append(entry)

    indian.sort(key=lambda x: x["confidence"], reverse=True)
    foreign.sort(key=lambda x: x["confidence"], reverse=True)

    top = indian[0] if indian else (foreign[0] if foreign else {"name": "Wheat", "confidence": 60})

    return {
        "top_recommendation": {
            "name": top["name"],
            "confidence": top["confidence"],
            "reason": f"Best match for {soil['soil_type']} soil with pH {ph}",
        },
        "indian_crops": indian[:3],
        "foreign_crops": foreign[:3],
        "soil_summary": {
            "nitrogen": N, "phosphorus": P, "potassium": K, "ph": ph,
        },
        "season": season,
        "budget_per_acre": budget,
        "data_source": "crop_database",
    }


# ══════════════════════════════════════════════════════════════════════
#  Tool 4: Environmental Risk Assessment
# ══════════════════════════════════════════════════════════════════════

def tool_assess_risk(lat: float, lon: float) -> Dict[str, Any]:
    """
    Assess environmental risks at given coordinates.

    Returns risk level, weather forecast, risk factors, advisory,
    and profit estimates. Deterministic based on coordinates.
    """
    if not (-90 <= lat <= 90):
        return {"error": f"Invalid latitude: {lat}. Must be between -90 and 90."}
    if not (-180 <= lon <= 180):
        return {"error": f"Invalid longitude: {lon}. Must be between -180 and 180."}

    profile = _match_region(lat, lon)
    t = _coord_seed(lat, lon)
    t2 = _coord_seed(lon, lat)

    soil_temp = round(_lerp(*profile["soil_temp_range"], t), 1)
    soil_moist = round(_lerp(*profile["soil_moisture_range"], t2))

    # Weather
    base_temp_low = round(_lerp(12, 28, t))
    base_temp_high = base_temp_low + round(_lerp(6, 14, t2))
    humidity = round(_lerp(30, 85, t2))
    wind = round(_lerp(5, 35, t))

    if soil_moist > 60:
        rain_label = "Heavy" if humidity > 70 else "Moderate"
    elif soil_moist > 40:
        rain_label = "Moderate" if humidity > 55 else "Light"
    else:
        rain_label = "Light" if humidity > 40 else "None"

    # Risk flags
    risk_flags = []
    if soil_temp < 5.0 or base_temp_low <= 4:
        risk_flags.append("Frost")
    if soil_moist < 20 or (humidity < 30 and rain_label in ("None", "Light")):
        risk_flags.append("Drought")
    if (soil_moist > 75 and soil_temp > 20) or (humidity >= 85 and 15 <= base_temp_low <= 35):
        risk_flags.append("Fungal")

    if len(risk_flags) >= 2 or "Frost" in risk_flags:
        risk_level = "High"
        risk_pct = round(_lerp(55, 80, t))
    elif len(risk_flags) == 1:
        risk_level = "Moderate"
        risk_pct = round(_lerp(26, 50, t))
    else:
        risk_level = "Low"
        risk_pct = round(_lerp(5, 25, t))

    advisories = {
        "Low": "Conditions are favorable. Ideal sowing window is open.",
        "Moderate": f"Monitor weather closely. {'Soil moisture is low — consider irrigation.' if 'Drought' in risk_flags else 'Moderate rainfall expected.'}",
        "High": f"{'Frost alert — protect sensitive crops.' if 'Frost' in risk_flags else 'Severe conditions detected.'} {'High fungal risk — apply preventive spray.' if 'Fungal' in risk_flags else ''}".strip(),
    }

    # Profit estimate
    base_profit = round(_lerp(38000, 55000, t))
    profit_best = round(base_profit * (1 + (1 - risk_pct / 100) * 0.3))
    profit_worst = round(base_profit * (1 - risk_pct / 100 * 0.5))
    profit_expected = round((profit_best + profit_worst) / 2)

    return {
        "risk_level": risk_level,
        "risk_percentage": risk_pct,
        "risk_factors": risk_flags,
        "weather": {
            "temp_range": f"{base_temp_low}-{base_temp_high}°C",
            "humidity_percent": humidity,
            "rain_forecast": rain_label,
            "wind_speed_kmh": wind,
        },
        "soil_conditions": {
            "soil_temperature": soil_temp,
            "soil_moisture": soil_moist,
            "soil_type": profile["soil_type"],
        },
        "advisory": advisories.get(risk_level, ""),
        "profit_estimate": {
            "best_case_per_acre": profit_best,
            "worst_case_per_acre": profit_worst,
            "expected_per_acre": profit_expected,
        },
        "coordinates": {"lat": lat, "lon": lon},
    }
