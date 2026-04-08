import datetime

# Hardcoded lifecycle dictionaries for crops
# Each crop defines its total lifecycle duration and specific stage windows in days
CROP_LIFECYCLES = {
    "maize": {
        "total_days": 120,
        "stages": [
            {"name": "seedling", "start": 0, "end": 20},
            {"name": "vegetative", "start": 21, "end": 60},
            {"name": "flowering", "start": 61, "end": 90},
            {"name": "harvesting", "start": 91, "end": 120}
        ]
    },
    "rice": {
        "total_days": 150,
        "stages": [
            {"name": "seedling", "start": 0, "end": 30},
            {"name": "vegetative", "start": 31, "end": 90},
            {"name": "flowering", "start": 91, "end": 120},
            {"name": "harvesting", "start": 121, "end": 150}
        ]
    },
    "soybean": {
        "total_days": 100,
        "stages": [
            {"name": "seedling", "start": 0, "end": 15},
            {"name": "vegetative", "start": 16, "end": 50},
            {"name": "flowering", "start": 51, "end": 75},
            {"name": "harvesting", "start": 76, "end": 100}
        ]
    },
    "wheat": {
        "total_days": 130,
        "stages": [
            {"name": "germination", "start": 0, "end": 15},
            {"name": "tillering", "start": 16, "end": 45},
            {"name": "booting", "start": 46, "end": 80},
            {"name": "heading", "start": 81, "end": 100},
            {"name": "ripening", "start": 101, "end": 130}
        ]
    },
    "tomato": {
        "total_days": 90,
        "stages": [
            {"name": "establishment", "start": 0, "end": 20},
            {"name": "vegetative", "start": 21, "end": 45},
            {"name": "flowering", "start": 46, "end": 70},
            {"name": "fruit-set", "start": 71, "end": 90}
        ]
    },
    "sugarcane": {
        "total_days": 365,
        "stages": [
            {"name": "germination", "start": 0, "end": 60},
            {"name": "tillering", "start": 61, "end": 120},
            {"name": "grand-growth", "start": 121, "end": 270},
            {"name": "maturity", "start": 271, "end": 365}
        ]
    },
    "cotton": {
        "total_days": 160,
        "stages": [
            {"name": "emergence", "start": 0, "end": 20},
            {"name": "squaring", "start": 21, "end": 50},
            {"name": "flowering", "start": 51, "end": 110},
            {"name": "boll-development", "start": 111, "end": 160}
        ]
    },
    "onion": {
        "total_days": 120,
        "stages": [
            {"name": "establishment", "start": 0, "end": 30},
            {"name": "leaf-growth", "start": 31, "end": 70},
            {"name": "bulb-formation", "start": 71, "end": 100},
            {"name": "maturity", "start": 101, "end": 120}
        ]
    },
    "mustard": {
        "total_days": 110,
        "stages": [
            {"name": "seedling", "start": 0, "end": 20},
            {"name": "vegetative", "start": 21, "end": 50},
            {"name": "flowering", "start": 51, "end": 80},
            {"name": "pod-filling", "start": 81, "end": 110}
        ]
    }
}

def get_crop_stage(crop_name: str, planting_date_str: str) -> dict:
    """
    Calculates the current tracking point of a crop given a planting date.
    
    Args:
        crop_name (str): The name of the crop (e.g., 'maize', 'rice', 'soybean').
        planting_date_str (str): The date the crop was planted in 'YYYY-MM-DD' format.
    
    Returns:
        dict: A dictionary containing 'current_day', 'total_days', and 'current_stage'.
    """
    crop_key = crop_name.lower()
    
    # Check if the crop exists in our knowledge base
    if crop_key not in CROP_LIFECYCLES:
        return {
            "error": f"Lifecycle for crop '{crop_name}' is not defined.",
            "current_day": 0, 
            "total_days": 0, 
            "current_stage": "unknown"
        }
    
    try:
        # Parse the input string into a date object
        planting_date = datetime.datetime.strptime(planting_date_str, "%Y-%m-%d").date()
    except ValueError:
        return {
            "error": "Invalid date format. Expected 'YYYY-MM-DD'.",
            "current_day": 0, 
            "total_days": 0, 
            "current_stage": "unknown"
        }
        
    # Standardize time by comparing the planting date against today's date
    today = datetime.date.today()
    current_day = (today - planting_date).days
    
    crop_info = CROP_LIFECYCLES[crop_key]
    total_days = crop_info["total_days"]
    
    # Identify the correct stage
    current_stage = "unknown"
    
    if current_day < 0:
        current_stage = "pre-planting"
    elif current_day > total_days:
        current_stage = "post-harvest"
    else:
        # Iterate over stages to find where the current_day falls
        for stage in crop_info["stages"]:
            if stage["start"] <= current_day <= stage["end"]:
                current_stage = stage["name"]
                break
                
    return {
        "current_day": current_day,
        "total_days": total_days,
        "current_stage": current_stage
    }

def predict_climate_risk(crop_name: str, current_stage: str, forecast_data: dict) -> list:
    """
    Evaluates weather forecast data against the crop's current growth stage
    to identify and return any applicable climate risks.

    Args:
        crop_name (str): The name of the crop.
        current_stage (str): The current growth stage (e.g., "seedling", "flowering").
        forecast_data (dict): Anticipated weather for the next 7 days, containing:
            - expected_rainfall_mm (float)
            - avg_temp_c (float)
            - humidity_percent (float)

    Returns:
        list: A list of risk dictionaries, each containing:
            - risk_name (str)
            - severity (str: "Low", "Medium", "High")
            - mitigation_tip (str)
    """
    risks = []
    crop_key = crop_name.lower()
    
    rain = forecast_data.get("expected_rainfall_mm", 0)
    temp = forecast_data.get("avg_temp_c", 25)
    humidity = forecast_data.get("humidity_percent", 50)
    
    # Global risks across stages
    if temp > 35 and humidity < 40:
        risks.append({
            "risk_name": "Heat Stress",
            "severity": "High",
            "mitigation_tip": "Increase irrigation immediately. Apply mulch to retain soil moisture."
        })
        
    # Stage-specific risks
    if current_stage == "seedling":
        if temp < 10:
            risks.append({
                "risk_name": "Frost Warning",
                "severity": "High",
                "mitigation_tip": "Apply protective covers overnight or delay planting if possible."
            })
        if rain > 100:
             risks.append({
                "risk_name": "Seedling Washout",
                "severity": "Medium",
                "mitigation_tip": "Ensure field drainage is clear. Avoid immediate fertilizer application."
             })
             
    elif current_stage == "vegetative":
        if temp > 30 and humidity > 80:
             risks.append({
                "risk_name": "Fungal Disease Outbreak",
                "severity": "High",
                "mitigation_tip": "Apply preventative fungicide. Ensure good plant spacing for airflow."
             })
        if rain < 10 and temp > 28:
             risks.append({
                 "risk_name": "Drought Stress",
                 "severity": "Medium",
                 "mitigation_tip": "Schedule deep irrigation to encourage deeper root growth."
             })
             
    elif current_stage == "flowering":
        if rain > 50:
            risks.append({
                "risk_name": "Blossom Drop",
                "severity": "High",
                "mitigation_tip": "Avoid overhead irrigation; monitor for poor pollination."
            })
        if temp > 35:
             risks.append({
                 "risk_name": "Pollen Sterility",
                 "severity": "High",
                 "mitigation_tip": "Provide afternoon shade if possible. Maintain optimal soil moisture."
             })
             
    elif current_stage == "harvesting":
        if rain > 20:
             risks.append({
                 "risk_name": "Harvest Delay / Spoilage",
                 "severity": "High",
                 "mitigation_tip": "Accelerate harvest if crop is mature. Prepare dry storage immediately."
             })
             
    # Crop-specific rules (example additions for more granularity)
    if crop_key == "maize" and current_stage == "vegetative" and rain > 150:
         risks.append({
             "risk_name": "Nutrient Leaching",
             "severity": "Medium",
             "mitigation_tip": "Plan for a split application of nitrogen fertilizer post-rain."
         })

    return risks

import json

def generate_action_plan(farm_data: dict, weather_forecast: dict, model1_disease: dict = None) -> dict:
    """
    Synthesizes farm state, weather data, and potential disease detections
    into a structured daily action plan for the farmer.

    Args:
        farm_data (dict): Contains 'crop_name', 'planting_date', and 'budget_remaining'.
        weather_forecast (dict): Anticipated weather (passed to predict_climate_risk).
        model1_disease (dict, optional): Result from CV model (e.g., {"disease": "Corn Blight", "confidence": 0.95}).

    Returns:
        dict: A daily report payload containing the tracker, status, immediate actions, and financial advisory.
    """
    crop_name = farm_data.get("crop_name", "")
    planting_date = farm_data.get("planting_date", "")
    budget = farm_data.get("budget_remaining", 0)

    # 1. Timeline Engine
    stage_info = get_crop_stage(crop_name, planting_date)
    current_day = stage_info.get("current_day", 0)
    total_days = stage_info.get("total_days", 0)
    current_stage = stage_info.get("current_stage", "unknown")

    # 2. Risk Engine
    climate_risks = []
    if current_stage not in ["unknown", "pre-planting", "post-harvest"]:
         climate_risks = predict_climate_risk(crop_name, current_stage, weather_forecast)

    # 3. Synthesize the report
    day_tracker = f"Day {current_day} / {total_days} ({current_stage.title()} Stage)"
    
    immediate_actions = []
    is_critical = False

    # Incorporate Model 1 Disease findings
    if model1_disease and model1_disease.get("disease"):
        disease_name = model1_disease["disease"]
        is_critical = True
        immediate_actions.append(f"URGENT: Identified {disease_name}. Apply specific cure/fungicide immediately.")

    # Incorporate Weather Risks
    for risk in climate_risks:
        if risk["severity"] == "High":
            is_critical = True
        immediate_actions.append(f"{risk['severity']} Risk - {risk['risk_name']}: {risk['mitigation_tip']}")

    # Determine overall status
    status = "Critical" if is_critical else "On Track"

    if not immediate_actions and status == "On Track":
        immediate_actions.append("Continue standard stage-appropriate maintenance. No immediate risks detected.")

    # Financial Advisory
    financial_advisory = ""
    if budget < 5000:
        financial_advisory = "Warning: Budget is low (under 5000). Delay non-essential fertilizer or pesticide applications."
    else:
        financial_advisory = "Budget is healthy. Proceed with planned applications."

    daily_report = {
        "day_tracker": day_tracker,
        "status": status,
        "immediate_actions": immediate_actions,
        "financial_advisory": financial_advisory
    }

    return daily_report

# Quick testing interface (will only execute if run directly)
if __name__ == "__main__":
    # Example: 45 days before today (Flowering stage for Maize)
    sample_plant_date = (datetime.date.today() - datetime.timedelta(days=45)).strftime("%Y-%m-%d")
    
    dummy_farm_data = {
        "crop_name": "maize",
        "planting_date": sample_plant_date,
        "budget_remaining": 4500
    }
    
    dummy_weather = {
        "expected_rainfall_mm": 60,  # High rain during flowering
        "avg_temp_c": 28,
        "humidity_percent": 70
    }
    
    dummy_disease = {
        "disease": "Northern Corn Leaf Blight",
        "confidence": 0.88
    }

    print("\n--- TEST: Critical Status with Disease & Climate Risk ---")
    report1 = generate_action_plan(dummy_farm_data, dummy_weather, dummy_disease)
    print(json.dumps(report1, indent=4))

    print("\n--- TEST: On Track Status (Healthy Budget, Good Weather) ---")
    dummy_farm_data_good = {"crop_name": "soybean", "planting_date": sample_plant_date, "budget_remaining": 8000}
    dummy_weather_good = {"expected_rainfall_mm": 5, "avg_temp_c": 25, "humidity_percent": 50}
    report2 = generate_action_plan(dummy_farm_data_good, dummy_weather_good, model1_disease=None)
    print(json.dumps(report2, indent=4))

