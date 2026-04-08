"""
context_bridge.py — Cross-Feature Intelligence Bridge

Reads the outputs of all three ML pipelines and generates cross-linked
intelligence so features "talk to each other":

  1. bridge_vision_chat()       → Disease → auto chat guidance + cure
  2. bridge_map_risk()          → Soil/NDVI → enhanced risk flags + knowledge hub
  3. bridge_analysis_marketplace() → Health → marketplace listing prompt
"""

from typing import Dict, List, Any, Optional


# ══════════════════════════════════════════════
#  Disease Treatment Knowledge Base
# ══════════════════════════════════════════════

DISEASE_TREATMENTS: Dict[str, Dict[str, Any]] = {
    "Rust Fungus": {
        "urgency": "immediate",
        "cure_steps": [
            "Remove and destroy severely infected leaves immediately.",
            "Apply Propiconazole 25% EC at 1 ml/L of water. Spray in morning or evening.",
            "Repeat spray after 10-14 days if symptoms persist.",
            "Improve air circulation by thinning dense plant canopy.",
            "Apply potassium-rich fertilizer to strengthen plant resistance."
        ],
        "products": [
            {"name": "Propiconazole 25% EC (Tilt)", "qty": "500 ml", "est_cost": "Rs. 650", "category": "fungicide"},
            {"name": "Mancozeb 75% WP (backup)", "qty": "500 g", "est_cost": "Rs. 350", "category": "fungicide"},
            {"name": "MOP (Potassium boost)", "qty": "10 kg", "est_cost": "Rs. 270", "category": "fertilizer"},
        ],
        "voice_summary": "Rust Fungus detected on your crop. This needs immediate treatment. Spray Propiconazole (Tilt) at 1 ml per litre of water. Do this early morning or late evening. Repeat after 14 days.",
    },
    "Leaf Blight": {
        "urgency": "within_3_days",
        "cure_steps": [
            "Remove infected leaves and burn them away from the field.",
            "Spray Mancozeb 75% WP at 2.5 g/L of water on remaining foliage.",
            "Ensure good drainage — waterlogged soil worsens blight.",
            "Apply copper-based fungicide if symptoms spread to stems.",
            "Rotate crops next season to break the disease cycle."
        ],
        "products": [
            {"name": "Mancozeb 75% WP (Dithane M-45)", "qty": "500 g", "est_cost": "Rs. 350", "category": "fungicide"},
            {"name": "Copper Oxychloride 50% WP", "qty": "500 g", "est_cost": "Rs. 420", "category": "fungicide"},
        ],
        "voice_summary": "Leaf Blight has been detected. Spray Mancozeb at 2.5 grams per litre within the next 3 days. Remove and burn any badly infected leaves.",
    },
    "Powdery Mildew": {
        "urgency": "within_3_days",
        "cure_steps": [
            "Apply wettable Sulfur dust (3 g/L) or Karathane spray.",
            "Avoid overhead irrigation — keep foliage dry.",
            "Improve spacing between plants for better air circulation.",
            "Apply neem oil (5 ml/L) as a preventive on unaffected plants.",
            "Monitor every 3 days and re-spray if white patches reappear."
        ],
        "products": [
            {"name": "Wettable Sulfur 80% WP", "qty": "500 g", "est_cost": "Rs. 180", "category": "fungicide"},
            {"name": "Karathane 48% EC", "qty": "250 ml", "est_cost": "Rs. 520", "category": "fungicide"},
            {"name": "Neem Oil (organic)", "qty": "1 L", "est_cost": "Rs. 280", "category": "organic"},
        ],
        "voice_summary": "Powdery Mildew found. Apply Sulfur dust or Karathane spray. Do not water from the top. Keep plants spaced out for air flow.",
    },
    "Aphid Infestation": {
        "urgency": "within_3_days",
        "cure_steps": [
            "Spray Imidacloprid 17.8% SL at 0.5 ml/L on the underside of leaves.",
            "Use yellow sticky traps to monitor and reduce flying aphid population.",
            "Release natural predators (ladybugs) if available.",
            "Apply neem oil (5 ml/L) as organic alternative for mild infestation.",
            "Avoid excessive nitrogen fertilizer — it attracts aphids."
        ],
        "products": [
            {"name": "Imidacloprid 17.8% SL (Confidor)", "qty": "250 ml", "est_cost": "Rs. 550", "category": "insecticide"},
            {"name": "Yellow Sticky Traps (pack of 20)", "qty": "1 pack", "est_cost": "Rs. 320", "category": "trap"},
            {"name": "Neem Oil (organic)", "qty": "1 L", "est_cost": "Rs. 280", "category": "organic"},
        ],
        "voice_summary": "Aphids detected on your crop. Spray Imidacloprid under the leaves. Put up yellow sticky traps. Reduce nitrogen fertilizer.",
    },
}


# ══════════════════════════════════════════════
#  Knowledge Hub Topic Database
# ══════════════════════════════════════════════

KNOWLEDGE_TOPICS: Dict[str, List[Dict[str, str]]] = {
    "drought": [
        {"topic": "Drip Irrigation", "technique": "Micro-irrigation",
         "description": "Install drip lines at 30-45 cm spacing. Saves 40-60% water vs. flood irrigation. Govt subsidy available under PMKSY.",
         "priority": "high"},
        {"topic": "Mulching", "technique": "Soil moisture conservation",
         "description": "Apply 5-8 cm organic mulch (straw, dried leaves) around crop base. Reduces evaporation by 25-30%.",
         "priority": "high"},
        {"topic": "Drought-Resistant Varieties", "technique": "Crop selection",
         "description": "Consider switching to drought-tolerant varieties: Bajra (HHB-67), Jowar (CSH-14), Moth Bean for arid zones.",
         "priority": "medium"},
        {"topic": "Rainwater Harvesting", "technique": "Water storage",
         "description": "Build farm ponds (10m x 10m x 3m) to store monsoon runoff. Eligible for MGNREGA funding.",
         "priority": "medium"},
    ],
    "waterlogging": [
        {"topic": "Raised Bed Farming", "technique": "Drainage management",
         "description": "Create 15-20 cm raised beds with furrows for excess water drainage. Essential for black cotton soils.",
         "priority": "high"},
        {"topic": "Subsurface Drainage", "technique": "Engineering solution",
         "description": "Install perforated PVC pipes at 60-90 cm depth spaced 15-20 m apart to remove excess soil water.",
         "priority": "medium"},
    ],
    "low_vegetation": [
        {"topic": "Green Manuring", "technique": "Soil restoration",
         "description": "Sow Dhaincha or Sunhemp as green manure crop. Plough in at 45 days to boost organic matter and nitrogen.",
         "priority": "high"},
        {"topic": "Cover Cropping", "technique": "Soil protection",
         "description": "Plant cover crops (Cowpea, Horse Gram) between main crop rows to prevent soil erosion and improve fertility.",
         "priority": "medium"},
    ],
    "fungal_risk": [
        {"topic": "Integrated Disease Management", "technique": "Prevention",
         "description": "Combine resistant varieties + seed treatment (Thiram 3g/kg) + preventive fungicide spray at 30-day intervals.",
         "priority": "high"},
        {"topic": "Proper Spacing & Pruning", "technique": "Cultural practice",
         "description": "Maintain recommended row spacing. Prune lower leaves to improve air circulation and reduce humidity around plants.",
         "priority": "medium"},
    ],
}


# ══════════════════════════════════════════════
#  Bridge 1: Vision + Chat
# ══════════════════════════════════════════════

def bridge_vision_chat(disease_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cross-link disease detection with chatbot guidance.
    If a disease is found, generates an auto-cure message with treatment
    steps, product recommendations, and urgency level.
    """
    disease_name = disease_result.get("disease_name", "Unknown")
    severity = disease_result.get("severity", "None")
    confidence = disease_result.get("confidence", 0)

    # Healthy crop — congratulatory guidance
    if disease_name == "Healthy" or severity == "None":
        return {
            "auto_message": (
                "Great news! Your crop appears healthy with "
                f"{int(confidence * 100)}% confidence. "
                "Continue regular monitoring and maintain current practices."
            ),
            "cure_steps": [],
            "products": [],
            "urgency": "none",
            "voice_summary": "Your crop is healthy. Keep up the good work! Continue regular monitoring.",
            "disease_detected": False,
        }

    # Disease found — generate treatment guidance
    treatment = DISEASE_TREATMENTS.get(disease_name, {})

    auto_message = (
        f"Alert: {disease_name} detected with {severity} severity "
        f"({int(confidence * 100)}% confidence). "
    )

    if treatment:
        auto_message += treatment.get("cure_steps", ["Consult local agronomist."])[0]
        urgency = treatment.get("urgency", "within_3_days")
    else:
        auto_message += "Consult your local agricultural extension officer for treatment."
        urgency = "within_3_days"

    return {
        "auto_message": auto_message,
        "cure_steps": treatment.get("cure_steps", ["Consult local agronomist for specific treatment."]),
        "products": treatment.get("products", []),
        "urgency": urgency,
        "voice_summary": treatment.get("voice_summary", f"{disease_name} detected. Please consult your local agronomist."),
        "disease_detected": True,
    }


# ══════════════════════════════════════════════
#  Bridge 2: Map + Risk
# ══════════════════════════════════════════════

def bridge_map_risk(
    land_result: Dict[str, Any],
    env_risk_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Cross-link soil/NDVI data with the risk tracker.
    Auto-flags drought stress, waterlogging, or vegetation decline
    based on actual soil conditions, and populates the knowledge hub.
    """
    moisture = land_result.get("soil_moisture", land_result.get("moisture", 45))
    soil_temp = land_result.get("soil_temperature", 25)
    ndvi = land_result.get("ndvi_score", 0.5)
    health_score = land_result.get("health_score", 50)
    soil_type = land_result.get("soil_type", "Unknown")

    existing_risk_factors = env_risk_result.get("risk_factors", [])

    risk_alerts: List[Dict[str, Any]] = []
    knowledge_hub: List[Dict[str, str]] = []

    # --- Drought Stress ---
    if moisture < 25:
        risk_alerts.append({
            "type": "Drought Stress",
            "severity": "HIGH" if moisture < 15 else "MODERATE",
            "trigger": f"soil_moisture={moisture}%",
            "message": f"Soil moisture critically low at {moisture}%. Immediate irrigation needed.",
            "icon": "droplet",
        })
        knowledge_hub.extend(KNOWLEDGE_TOPICS.get("drought", []))
    elif moisture < 35 and "Drought" not in existing_risk_factors:
        risk_alerts.append({
            "type": "Low Moisture Warning",
            "severity": "LOW",
            "trigger": f"soil_moisture={moisture}%",
            "message": f"Soil moisture at {moisture}% — approaching stress threshold. Plan irrigation.",
            "icon": "droplet",
        })
        # Add just top-priority drought knowledge
        knowledge_hub.append(KNOWLEDGE_TOPICS["drought"][0])

    # --- Waterlogging Risk ---
    if moisture > 80 and soil_temp > 20:
        risk_alerts.append({
            "type": "Waterlogging Risk",
            "severity": "HIGH" if moisture > 90 else "MODERATE",
            "trigger": f"soil_moisture={moisture}%, soil_temp={soil_temp}C",
            "message": f"Excess soil moisture ({moisture}%) with warm temperatures. Root rot and fungal risk elevated.",
            "icon": "water",
        })
        knowledge_hub.extend(KNOWLEDGE_TOPICS.get("waterlogging", []))

    # --- Vegetation Decline ---
    if ndvi < 0.3:
        risk_alerts.append({
            "type": "Vegetation Decline",
            "severity": "HIGH" if ndvi < 0.15 else "MODERATE",
            "trigger": f"ndvi={ndvi}",
            "message": f"NDVI at {ndvi} indicates poor vegetation cover. Soil restoration recommended.",
            "icon": "leaf-off",
        })
        knowledge_hub.extend(KNOWLEDGE_TOPICS.get("low_vegetation", []))

    # --- Fungal conditions from soil ---
    if moisture > 70 and soil_temp > 20 and "Fungal" not in existing_risk_factors:
        risk_alerts.append({
            "type": "Fungal Conditions",
            "severity": "MODERATE",
            "trigger": f"soil_moisture={moisture}%, soil_temp={soil_temp}C",
            "message": "Warm, wet soil conditions favor fungal growth. Apply preventive fungicide.",
            "icon": "bug",
        })
        knowledge_hub.extend(KNOWLEDGE_TOPICS.get("fungal_risk", []))

    # Deduplicate knowledge hub by topic
    seen_topics = set()
    unique_knowledge = []
    for entry in knowledge_hub:
        if entry["topic"] not in seen_topics:
            seen_topics.add(entry["topic"])
            unique_knowledge.append(entry)

    return {
        "risk_alerts": risk_alerts,
        "knowledge_hub": unique_knowledge,
        "soil_summary": {
            "moisture_status": "Critical" if moisture < 20 else "Low" if moisture < 35 else "Optimal" if moisture < 70 else "Excess",
            "vegetation_status": "Poor" if ndvi < 0.3 else "Moderate" if ndvi < 0.5 else "Good" if ndvi < 0.7 else "Excellent",
            "overall_land_grade": "A" if health_score >= 80 else "B" if health_score >= 60 else "C" if health_score >= 40 else "D",
        },
    }


# ══════════════════════════════════════════════
#  Bridge 3: Analysis + Marketplace
# ══════════════════════════════════════════════

# Yield estimates by crop (quintals per acre) and typical mandi prices
CROP_YIELD_ESTIMATES: Dict[str, Dict[str, Any]] = {
    "Wheat": {"yield_q_per_acre": 18, "mandi_price_per_q": 2275, "harvest_months": "Mar-Apr"},
    "Millets": {"yield_q_per_acre": 10, "mandi_price_per_q": 2500, "harvest_months": "Oct-Nov"},
    "Rice": {"yield_q_per_acre": 22, "mandi_price_per_q": 2183, "harvest_months": "Oct-Nov"},
    "Mustard": {"yield_q_per_acre": 8, "mandi_price_per_q": 5650, "harvest_months": "Feb-Mar"},
    "Chickpea": {"yield_q_per_acre": 7, "mandi_price_per_q": 5440, "harvest_months": "Feb-Mar"},
}


def bridge_analysis_marketplace(
    disease_result: Dict[str, Any],
    land_result: Dict[str, Any],
    crop_info: Dict[str, Any],
    profit_info: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Cross-link analysis results with the marketplace.
    If the crop is healthy + high-yield, auto-prompt the farmer to
    list the harvest on the marketplace with pre-filled data.
    """
    disease_name = disease_result.get("disease_name", "Unknown")
    severity = disease_result.get("severity", "None")
    ndvi = land_result.get("ndvi_score", 0.5)
    health_score = land_result.get("health_score", 50)
    crop_name = crop_info.get("name", "Wheat")

    # Conditions for marketplace listing
    is_healthy = (disease_name == "Healthy" or severity == "None")
    good_vegetation = ndvi > 0.5
    good_land = health_score >= 60

    should_list = is_healthy and good_vegetation and good_land

    if should_list:
        # Look up yield and price data
        crop_data = CROP_YIELD_ESTIMATES.get(crop_name, {
            "yield_q_per_acre": 15,
            "mandi_price_per_q": 2000,
            "harvest_months": "Next season",
        })

        predicted_yield_kg = crop_data["yield_q_per_acre"] * 100  # quintals → kg
        suggested_price = round(crop_data["mandi_price_per_q"] / 100, 1)  # per kg
        expected_revenue = profit_info.get("expected", predicted_yield_kg * suggested_price)

        return {
            "should_list": True,
            "message": (
                f"Your {crop_name} crop looks excellent! "
                f"Health score: {health_score}/100, NDVI: {ndvi}. "
                f"List this harvest on the Smart Farm Marketplace to connect with buyers."
            ),
            "pre_filled": {
                "crop_name": crop_name,
                "predicted_yield_kg": predicted_yield_kg,
                "suggested_price_per_kg": suggested_price,
                "estimated_revenue": expected_revenue,
                "harvest_window": crop_data["harvest_months"],
                "quality_grade": "A" if health_score >= 80 else "B",
            },
            "confidence_reason": f"Healthy crop ({int(disease_result.get('confidence', 0.9) * 100)}% conf), NDVI={ndvi}, land score={health_score}",
        }
    else:
        # Build reason string
        reasons = []
        if not is_healthy:
            reasons.append(f"{disease_name} detected ({severity} severity)")
        if not good_vegetation:
            reasons.append(f"Low NDVI ({ndvi})")
        if not good_land:
            reasons.append(f"Low health score ({health_score}/100)")

        return {
            "should_list": False,
            "message": (
                "Marketplace listing not recommended at this time. "
                f"Reason: {'; '.join(reasons)}. "
                "Focus on treatment and soil improvement first."
            ),
            "pre_filled": None,
            "confidence_reason": "; ".join(reasons),
        }


# ══════════════════════════════════════════════
#  Unified Intelligence Report Builder
# ══════════════════════════════════════════════

def build_intelligence_report(
    disease_result: Dict[str, Any],
    land_result: Dict[str, Any],
    env_risk_result: Dict[str, Any],
    crop_info: Dict[str, Any],
    profit_info: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Master function: runs all three bridges and returns a unified
    intelligence report to embed in the /analyze_farm response.
    """
    chat_guidance = bridge_vision_chat(disease_result)
    map_risk = bridge_map_risk(land_result, env_risk_result)
    marketplace = bridge_analysis_marketplace(
        disease_result, land_result, crop_info, profit_info
    )

    return {
        "chat_guidance": chat_guidance,
        "risk_alerts": map_risk["risk_alerts"],
        "knowledge_hub": map_risk["knowledge_hub"],
        "soil_summary": map_risk["soil_summary"],
        "marketplace_prompt": marketplace,
    }
