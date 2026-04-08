"""
deep_insights.py — Data-Rich Insight Objects

Generates professional-grade analytical outputs:
  1. Risk Details    — probability scores, time-to-impact, trends
  2. Nutrient Profile — rainfall-adjusted NPK with optimal ranges
  3. Scheme Matches  — govt scheme eligibility scoring
"""

import math
from typing import Dict, List, Any, Optional


# ══════════════════════════════════════════════
#  Helper: coordinate-based seed
# ══════════════════════════════════════════════
def _seed(lat: float, lon: float, salt: float = 0) -> float:
    raw = abs(math.sin((lat + salt) * 12.9898 + lon * 78.233) * 43758.5453)
    return raw - int(raw)


def _lerp(lo: float, hi: float, t: float) -> float:
    return lo + (hi - lo) * max(0, min(1, t))


# ══════════════════════════════════════════════
#  1. Risk Details — Probability + Time-to-Impact
# ══════════════════════════════════════════════

RISK_DEFINITIONS = [
    {
        "name": "Drought Stress",
        "icon": "droplet",
        "color": "#fbbf24",
        "moisture_threshold": 30,
        "temp_boost": False,
    },
    {
        "name": "Frost Damage",
        "icon": "snowflake",
        "color": "#93c5fd",
        "temp_threshold": 8,
        "temp_boost": False,
    },
    {
        "name": "Fungal Outbreak",
        "icon": "bug",
        "color": "#f87171",
        "moisture_threshold": 65,
        "temp_range": (18, 32),
    },
    {
        "name": "Heat Stress",
        "icon": "thermometer",
        "color": "#fb923c",
        "temp_threshold": 38,
        "temp_boost": True,
    },
    {
        "name": "Flood Risk",
        "icon": "water",
        "color": "#60a5fa",
        "moisture_threshold": 80,
        "temp_boost": False,
    },
]

TIME_LABELS = ["Imminent", "In 1-2 days", "In 3 days", "In 5-7 days", "In 2 weeks", "Unlikely"]


def build_risk_insights(
    env_risk: Dict[str, Any],
    soil_env: Dict[str, Any],
    lat: float = 0,
    lon: float = 0,
) -> List[Dict[str, Any]]:
    """Build data-rich risk detail objects with probability and time-to-impact."""

    soil_temp = soil_env.get("soil_temperature", 25)
    soil_moist = soil_env.get("soil_moisture", 45)
    risk_pct = env_risk.get("risk_percentage", 20)
    risk_factors = env_risk.get("risk_factors", [])

    results = []

    for i, rdef in enumerate(RISK_DEFINITIONS):
        t = _seed(lat, lon, salt=i * 7.3)
        name = rdef["name"]

        # --- Calculate probability based on actual conditions ---
        if name == "Drought Stress":
            prob = max(0, min(100, round(100 - soil_moist * 1.8 + t * 15)))
        elif name == "Frost Damage":
            prob = max(0, min(100, round(max(0, (10 - soil_temp) * 12) + t * 8)))
        elif name == "Fungal Outbreak":
            fungal_score = 0
            if soil_moist > 60:
                fungal_score += (soil_moist - 60) * 1.5
            if 18 <= soil_temp <= 32:
                fungal_score += 20
            prob = max(0, min(100, round(fungal_score + t * 10)))
        elif name == "Heat Stress":
            prob = max(0, min(100, round(max(0, (soil_temp - 30) * 15) + t * 10)))
        elif name == "Flood Risk":
            prob = max(0, min(100, round(max(0, (soil_moist - 70) * 3) + t * 8)))
        else:
            prob = round(t * 30)

        # --- Time-to-impact based on probability ---
        if prob >= 75:
            tti = TIME_LABELS[0]
            tti_days = 0
        elif prob >= 60:
            tti = TIME_LABELS[1]
            tti_days = 1
        elif prob >= 40:
            tti = TIME_LABELS[2]
            tti_days = 3
        elif prob >= 25:
            tti = TIME_LABELS[3]
            tti_days = 5
        elif prob >= 10:
            tti = TIME_LABELS[4]
            tti_days = 14
        else:
            tti = TIME_LABELS[5]
            tti_days = 30

        # --- Trend ---
        if prob > 50:
            trend = "rising"
        elif prob > 20:
            trend = "stable"
        else:
            trend = "falling"

        # --- Severity label ---
        if prob >= 70:
            severity = "Critical"
        elif prob >= 45:
            severity = "High"
        elif prob >= 25:
            severity = "Moderate"
        elif prob >= 10:
            severity = "Low"
        else:
            severity = "Minimal"

        results.append({
            "name": name,
            "icon": rdef["icon"],
            "color": rdef["color"],
            "probability_score": prob,
            "time_to_impact": tti,
            "time_to_impact_days": tti_days,
            "trend": trend,
            "severity": severity,
            "confidence": round(70 + t * 25),
        })

    # Sort by probability descending
    results.sort(key=lambda x: x["probability_score"], reverse=True)
    return results


# ══════════════════════════════════════════════
#  2. Nutrient Profile — Rainfall-Adjusted NPK
# ══════════════════════════════════════════════

NUTRIENT_STANDARDS = {
    "Nitrogen (N)": {"optimal": (50, 80), "unit": "kg/ha", "icon": "N"},
    "Phosphorus (P)": {"optimal": (20, 40), "unit": "kg/ha", "icon": "P"},
    "Potassium (K)": {"optimal": (100, 200), "unit": "kg/ha", "icon": "K"},
    "Zinc (Zn)": {"optimal": (1.5, 5.0), "unit": "mg/kg", "icon": "Zn"},
    "Sulfur (S)": {"optimal": (10, 25), "unit": "mg/kg", "icon": "S"},
    "Organic Carbon": {"optimal": (1.5, 3.0), "unit": "%", "icon": "OC"},
}


def build_nutrient_profile(
    land_result: Dict[str, Any],
    soil_env: Dict[str, Any],
    lat: float = 0,
    lon: float = 0,
) -> List[Dict[str, Any]]:
    """Build rainfall-adjusted nutrient profile with optimal ranges and deficit %."""

    moisture = soil_env.get("soil_moisture", land_result.get("moisture", 45))
    soil_npk = land_result.get("soil", {})
    organic_c = land_result.get("organic_carbon", 1.5)

    t1 = _seed(lat, lon, salt=100)
    t2 = _seed(lat, lon, salt=200)

    # Raw NPK values from land analysis
    raw_n = soil_npk.get("nitrogen", 50)
    raw_p = soil_npk.get("phosphorus", 25)
    raw_k = soil_npk.get("potassium", 120)

    # --- Rainfall adjustment ---
    # High moisture → nitrogen leaching, slight P fixation
    # Low moisture → potassium deficit
    if moisture > 70:
        adj_n = round(raw_n * 0.75)  # 25% leaching loss
        adj_p = round(raw_p * 0.9)   # slight fixation
        adj_k = raw_k
        rainfall_note = "Heavy recent rainfall — significant nitrogen leaching likely"
    elif moisture > 50:
        adj_n = round(raw_n * 0.9)
        adj_p = raw_p
        adj_k = raw_k
        rainfall_note = "Moderate rainfall — minor nutrient adjustment"
    elif moisture < 25:
        adj_n = raw_n
        adj_p = raw_p
        adj_k = round(raw_k * 0.8)  # drought K deficit
        rainfall_note = "Dry conditions — potassium uptake reduced"
    else:
        adj_n = raw_n
        adj_p = raw_p
        adj_k = raw_k
        rainfall_note = "Normal moisture — nutrients at baseline levels"

    # Simulated micronutrients from coordinates
    zinc = round(_lerp(0.5, 4.0, t1), 1)
    sulfur = round(_lerp(6, 22, t2), 1)

    # Build nutrient entries
    raw_values = {
        "Nitrogen (N)": adj_n,
        "Phosphorus (P)": adj_p,
        "Potassium (K)": adj_k,
        "Zinc (Zn)": zinc,
        "Sulfur (S)": sulfur,
        "Organic Carbon": organic_c,
    }

    recommendations = {
        "Nitrogen (N)": "Apply Urea 46% N at recommended dose split across growth stages",
        "Phosphorus (P)": "Apply DAP or SSP as basal dose before sowing",
        "Potassium (K)": "Apply MOP (Muriate of Potash) at sowing time",
        "Zinc (Zn)": "Apply ZnSO4 at 25 kg/ha to soil or 0.5% foliar spray",
        "Sulfur (S)": "Apply gypsum or single super phosphate as sulfur source",
        "Organic Carbon": "Incorporate FYM/compost at 5-10 t/ha + green manuring",
    }

    profile = []
    for nutrient, std in NUTRIENT_STANDARDS.items():
        val = raw_values.get(nutrient, 0)
        opt_lo, opt_hi = std["optimal"]

        # Status classification
        if val < opt_lo * 0.5:
            status = "Critical"
            status_color = "#f87171"
        elif val < opt_lo:
            status = "Low"
            status_color = "#fbbf24"
        elif val <= opt_hi:
            status = "Optimal"
            status_color = "#4ade80"
        elif val <= opt_hi * 1.3:
            status = "High"
            status_color = "#60a5fa"
        else:
            status = "Excess"
            status_color = "#f87171"

        # Deficit/surplus percentage relative to optimal midpoint
        midpoint = (opt_lo + opt_hi) / 2
        deficit_pct = round(((val - midpoint) / midpoint) * 100)

        # Normalize value to 0-100 scale for bar rendering (relative to optimal high)
        bar_pct = round(min(100, (val / opt_hi) * 100))

        profile.append({
            "nutrient": nutrient,
            "icon": std["icon"],
            "value": val,
            "unit": std["unit"],
            "optimal_range": [opt_lo, opt_hi],
            "status": status,
            "status_color": status_color,
            "deficit_pct": deficit_pct,
            "bar_pct": bar_pct,
            "recommendation": recommendations.get(nutrient, "Consult soil test report"),
        })

    return profile


# ══════════════════════════════════════════════
#  3. Govt Scheme Match Scores
# ══════════════════════════════════════════════

GOVT_SCHEMES = [
    {
        "name": "PM-KISAN",
        "full_name": "Pradhan Mantri Kisan Samman Nidhi",
        "benefit": "Rs. 6,000/year in 3 installments",
        "icon": "wallet",
        "max_land_ha": 100,  # any size eligible
        "how_to_apply": "Apply at nearest CSC or pmkisan.gov.in with Aadhaar + bank details",
        "base_score": 85,
    },
    {
        "name": "PM Fasal Bima",
        "full_name": "Pradhan Mantri Fasal Bima Yojana",
        "benefit": "Crop insurance at 1.5-5% premium (Kharif/Rabi)",
        "icon": "shield",
        "risk_boost": True,
        "how_to_apply": "Enrol through bank/CSC before sowing deadline. Need land records + crop info",
        "base_score": 70,
    },
    {
        "name": "Soil Health Card",
        "full_name": "Soil Health Card Scheme",
        "benefit": "Free soil testing + fertilizer recommendation every 2 years",
        "icon": "test-tube",
        "health_boost": True,
        "how_to_apply": "Contact nearest Krishi Vigyan Kendra (KVK) or soilhealth.dac.gov.in",
        "base_score": 75,
    },
    {
        "name": "PMKSY",
        "full_name": "Pradhan Mantri Krishi Sinchayee Yojana",
        "benefit": "55-100% subsidy on drip/sprinkler irrigation systems",
        "icon": "droplets",
        "moisture_boost": True,
        "how_to_apply": "Apply through state agriculture dept or pmksy.gov.in. Need land ownership proof",
        "base_score": 60,
    },
    {
        "name": "e-NAM",
        "full_name": "Electronic National Agriculture Market",
        "benefit": "Direct online selling to buyers across India at best price",
        "icon": "store",
        "ndvi_boost": True,
        "how_to_apply": "Register at enam.gov.in with Aadhaar + bank account. List produce online",
        "base_score": 55,
    },
    {
        "name": "KCC",
        "full_name": "Kisan Credit Card",
        "benefit": "Low-interest crop loan (4% p.a.) up to Rs. 3 lakh",
        "icon": "credit-card",
        "how_to_apply": "Apply at any bank with land records + ID. Simplified 1-page form",
        "base_score": 80,
    },
]


def build_scheme_matches(
    crop_name: str,
    area_acres: float,
    health_score: int,
    ndvi: float,
    soil_moisture: float,
    risk_level: str,
) -> List[Dict[str, Any]]:
    """Score govt schemes 0-100 based on farmer's land, crop, and conditions."""

    results = []

    for scheme in GOVT_SCHEMES:
        score = scheme["base_score"]
        eligibility_notes = []

        # --- Land size adjustments ---
        if area_acres <= 5:
            score += 10
            eligibility_notes.append("Small/marginal farmer — priority eligible")
        elif area_acres <= 10:
            score += 5
            eligibility_notes.append("Small farmer — eligible")
        else:
            eligibility_notes.append("Large farmer — standard eligibility")

        # --- Risk-based boost for insurance ---
        if scheme.get("risk_boost") and risk_level in ("High", "Critical"):
            score += 15
            eligibility_notes.append("High risk area — insurance highly recommended")
        elif scheme.get("risk_boost") and risk_level == "Moderate":
            score += 8

        # --- Health-based boost for soil health card ---
        if scheme.get("health_boost"):
            if health_score < 50:
                score += 20
                eligibility_notes.append("Low soil health — urgent testing recommended")
            elif health_score < 70:
                score += 10
                eligibility_notes.append("Moderate soil health — testing recommended")

        # --- Moisture-based boost for irrigation subsidy ---
        if scheme.get("moisture_boost"):
            if soil_moisture < 30:
                score += 25
                eligibility_notes.append("Low moisture — drip irrigation strongly advised")
            elif soil_moisture < 45:
                score += 12
                eligibility_notes.append("Below-average moisture — irrigation upgrade beneficial")

        # --- NDVI boost for marketplace ---
        if scheme.get("ndvi_boost"):
            if ndvi > 0.6:
                score += 20
                eligibility_notes.append("Good crop — ready for online market listing")
            elif ndvi > 0.4:
                score += 8

        # --- Crop-based adjustment ---
        high_value_crops = ["Wheat", "Rice", "Cotton", "Sugarcane"]
        if crop_name in high_value_crops:
            score += 5

        score = max(0, min(100, score))

        # Eligibility status
        if score >= 80:
            eligibility = "Highly Eligible"
            elig_color = "#4ade80"
        elif score >= 60:
            eligibility = "Eligible"
            elig_color = "#60a5fa"
        elif score >= 40:
            eligibility = "Partially Eligible"
            elig_color = "#fbbf24"
        else:
            eligibility = "Low Match"
            elig_color = "#f87171"

        results.append({
            "scheme_name": scheme["name"],
            "full_name": scheme["full_name"],
            "match_score": score,
            "eligibility": eligibility,
            "eligibility_color": elig_color,
            "benefit": scheme["benefit"],
            "how_to_apply": scheme["how_to_apply"],
            "icon": scheme["icon"],
            "notes": eligibility_notes,
        })

    # Sort by match score descending
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results


# ══════════════════════════════════════════════
#  Master: Build Deep Insights
# ══════════════════════════════════════════════

def build_deep_insights(
    land_result: Dict[str, Any],
    env_risk_result: Dict[str, Any],
    soil_env: Dict[str, Any],
    crop_name: str,
    area_acres: float,
    lat: float,
    lon: float,
) -> Dict[str, Any]:
    """Build the complete deep_insights block for the Intelligence Report."""

    health_score = land_result.get("health_score", 50)
    ndvi = land_result.get("ndvi_score", 0.5)
    soil_moisture = soil_env.get("soil_moisture", 45)
    risk_level = env_risk_result.get("risk_level", "Low")

    return {
        "risk_details": build_risk_insights(env_risk_result, soil_env, lat, lon),
        "nutrient_profile": build_nutrient_profile(land_result, soil_env, lat, lon),
        "scheme_matches": build_scheme_matches(
            crop_name, area_acres, health_score, ndvi, soil_moisture, risk_level
        ),
    }
