from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import bcrypt
from werkzeug.utils import secure_filename
from database import (
    init_db, add_analysis_record, add_market_listing,
    get_all_market_listings, save_farm_location, get_all_farm_locations,
    create_user, get_user_by_phone, insert_farmer,
    save_prediction, get_predictions
)
from harvest_predictor import predict_harvest_price
import uuid
import requests

from ai_interface import (
    analyze_soil_health,  # legacy
    predict_disease, calculate_land_health, predict_environmental_risk, predict_crop  # ML pipeline
)
from context_bridge import build_intelligence_report
from deep_insights import build_deep_insights
from daily_manager_model import generate_action_plan

app = Flask(__name__)
CORS(app)

# ── Configuration ──────────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
UPLOAD_FOLDER = 'uploads'

# Initialize database on startup
init_db()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _allowed_image(filename: str) -> bool:
    """Return True if the file extension is in the allowed image set."""
    ext = os.path.splitext(filename.lower())[1]
    return ext in ALLOWED_EXTENSIONS


def _validate_coordinates(lat, lon):
    """
    Return (lat_f, lon_f, error_msg).
    error_msg is None when valid; lat/lon are floats.
    """
    try:
        lat_f = float(lat) if lat is not None else None
        lon_f = float(lon) if lon is not None else None
    except (ValueError, TypeError):
        return None, None, "lat and lon must be numeric values."

    if lat_f is None or lon_f is None:
        return None, None, "lat and lon are required."
    if not (-90 <= lat_f <= 90):
        return None, None, f"lat must be between -90 and 90, got {lat_f}."
    if not (-180 <= lon_f <= 180):
        return None, None, f"lon must be between -180 and 180, got {lon_f}."
    return lat_f, lon_f, None


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route('/')
def home():
    return jsonify({
        "message": "Welcome to Smart Farm AI API",
        "status": "online",
        "endpoints": [
            "/health",
            "/analyze_farm",
            "/chat",
            "/api/market/view",
            "/api/auth/register",
            "/api/auth/login",
        ]
    }), 200

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "service": "Smart Farm AI Backend"}), 200


# ── Auth Endpoints (Audit Fix 1.2) ────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    """
    Register a new farmer user.
    Expects JSON: { name, phone, password, farm_size?, primary_crop? }
    Returns: { status, farmer_id, name }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    password = (data.get('password') or '').strip()
    farm_size = data.get('farm_size')
    primary_crop = data.get('primary_crop')

    # Validate required fields
    if not name:
        return jsonify({"error": "name is required"}), 400
    if not phone:
        return jsonify({"error": "phone is required"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    # Hash password with bcrypt
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user_id = create_user(name, phone, password_hash, farm_size, primary_crop)
    if user_id is None:
        return jsonify({"error": "A user with this phone number already exists"}), 409

    return jsonify({
        "status": "success",
        "message": "Registration successful",
        "farmer_id": user_id,
        "name": name,
        "phone": phone,
        "farm_size": farm_size,
        "primary_crop": primary_crop,
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """
    Login an existing farmer user.
    Expects JSON: { phone, password }
    Returns: { status, farmer_id, name, farm_size, primary_crop }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    phone = (data.get('phone') or '').strip()
    password = (data.get('password') or '').strip()

    if not phone or not password:
        return jsonify({"error": "phone and password are required"}), 400

    user = get_user_by_phone(phone)
    if not user:
        return jsonify({"error": "Invalid phone number or password"}), 401

    # Verify bcrypt hash
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({"error": "Invalid phone number or password"}), 401

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "farmer_id": user['id'],
        "name": user['name'],
        "phone": user['phone'],
        "farm_size": user.get('farm_size'),
        "primary_crop": user.get('primary_crop'),
    }), 200


# ── Farm Analysis ──────────────────────────────────────────────────────────────

@app.route('/analyze_farm', methods=['POST'])
def analyze_farm():
    """
    Route to analyze farm health using the ML pipeline.
    Accepts JSON or multipart/form-data with optional image.
    Expects: { "farmer_id": 1, "lat": 12.3, "lon": 77.4 }
    Optional: multipart/form-data with "image_file"
    """
    # --- 1. Extract data from the incoming request ---
    data = request.get_json(silent=True)
    if not data:
        data = request.form

    farmer_id = data.get('farmer_id')
    area_acres = data.get('area_acres')

    # --- Validate coordinates (Audit Fix 2.2) ---
    lat_raw = data.get('lat')
    lon_raw = data.get('lon')
    lat, lon, coord_error = _validate_coordinates(lat_raw, lon_raw)
    if coord_error:
        # Fall back to defaults if coordinates are missing/bad rather than hard error
        # so the app still works with partial data from the frontend
        lat = lat or 0.0
        lon = lon or 0.0

    try:
        area_acres = float(area_acres) if area_acres else 2.5
        if area_acres <= 0:
            area_acres = 2.5
    except (ValueError, TypeError):
        area_acres = 2.5

    # --- Secure image upload (Audit Fix 5.1) ---
    image_file = request.files.get('image_file')
    image_path = None
    if image_file and image_file.filename:
        if not _allowed_image(image_file.filename):
            return jsonify({
                "error": "Invalid file type. Only JPG, PNG, and WebP images are allowed."
            }), 400
        safe_name = secure_filename(image_file.filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        image_path = os.path.join(UPLOAD_FOLDER, safe_name)
        image_file.save(image_path)

    # --- 2. Run the three ML pipelines ---
    disease_result = predict_disease(image_path)
    land_result = calculate_land_health(lat, lon)

    # Thread soil environment into the risk engine so warnings are land-specific
    soil_env = land_result.pop("_soil_env", None)
    env_risk_result = predict_environmental_risk(lat, lon, soil_env=soil_env)

    # --- 3. Run ML Pipeline 2b: Crop Recommendation Model ---
    # Build env_data from the nested keys in env_risk_result
    _sc = env_risk_result.get("soil_conditions", {})
    _wx = env_risk_result.get("weather", {})
    # Estimate weekly rain from rain_forecast label
    _rain_label = _wx.get("rain_forecast", "Moderate")
    _rain_mm_7d = {"Heavy": 70, "Moderate": 35, "Light": 10, "None": 0}.get(_rain_label, 35)
    crop_env_data = {
        "soil_temperature": _sc.get("soil_temperature", 25.0),
        "humidity": _wx.get("humidity", 60.0),
        "total_rain_7d_mm": _rain_mm_7d,
    }
    crop_recommendation = predict_crop(land_result["soil"], crop_env_data)
    
    top_match = crop_recommendation.get("top_match")
    if not top_match:
        top_match = {"name": "Wheat", "confidence": "0%", "icon": "🌾"}

    crop_info = {
        "top_match": {
            "name": top_match.get("name", "Wheat"),
            "confidence": top_match.get("confidence", 0),
            "breakdown": top_match.get("breakdown", {"soil": 90, "climate": 90, "market": 90, "water": 90}),
            "water_requirement": top_match.get("water_requirement", "Medium"),
            "sunlight_requirement": top_match.get("sunlight_requirement", "Medium"),
            "icon": top_match.get("icon", "🌾"),
            "season": "Rabi" if env_risk_result.get("soil_conditions", {}).get("soil_temperature", 25) < 22 else "Kharif",
            "sow": "Current Season"
        },
        "indian": crop_recommendation.get("indian", []),
        "foreign": crop_recommendation.get("foreign", [])
    }

    profit_info = {
        "best": env_risk_result["profit_estimate"]["best_case"],
        "worst": env_risk_result["profit_estimate"]["worst_case"],
        "expected": env_risk_result["profit_estimate"]["expected"],
        "risk": env_risk_result["risk_percentage"]
    }

    # --- 4. Run ML Pipeline 3: Daily Manager & Risk Tracking ---
    import datetime
    from daily_manager_model import generate_action_plan, get_crop_stage

    # --- FETCH USER DATA (Audit Fix) ---
    user_data = get_user_by_phone(request.headers.get('X-User-Phone')) if farmer_id else None
    
    # ── Timeline Logic (Real Dates) ──
    # Check if a specific planting date was sent in the request, otherwise fallback to DB or simulated
    planting_date_str = data.get('planting_date')
    if not planting_date_str and user_data:
        # For demo, if user was created today, we'll still simulate an older date to show stages
        # In a real app, we'd have a 'farms' table with 'planted_on'
        planting_date_str = user_data.get('created_at', "").split(" ")[0]
    
    if not planting_date_str:
        planting_date_str = (datetime.date.today() - datetime.timedelta(days=25)).strftime("%Y-%m-%d")

    # Normalize crop name
    crop_name_for_manager = crop_info["top_match"]["name"].lower()
    SUPPORTED_CROPS = {"maize", "rice", "soybean", "wheat", "tomato", "sugarcane", "cotton", "onion", "mustard"}
    if crop_name_for_manager not in SUPPORTED_CROPS:
        crop_name_for_manager = "maize"

    farm_data = {
        "crop_name": crop_name_for_manager,
        "planting_date": planting_date_str,
        "budget_remaining": 50000 
    }

    # Build weather forecast from risk engine output
    rain_label = env_risk_result["weather"].get("rain_forecast", "Light")
    rainfall_mm = 100 if rain_label == "Heavy" else (40 if rain_label == "Moderate" else 10)
    humidity = env_risk_result["weather"].get("humidity", 50)
    try:
        temp_str = env_risk_result["weather"].get("temp_range", "25-32").split("-")[0]
        avg_temp = float(temp_str)
    except (ValueError, IndexError):
        avg_temp = 25.0

    weather_forecast = {
        "expected_rainfall_mm": rainfall_mm,
        "avg_temp_c": avg_temp,
        "humidity_percent": humidity
    }

    # Pass disease to manager only if it's an actual high-severity detection
    disease_trigger = None
    if disease_result and disease_result["severity"] in ["High", "Critical"]:
        disease_trigger = {"disease": disease_result["disease_name"], "confidence": disease_result["confidence"]}

    # Call both – stage info for UI and the full action plan
    stage_info = get_crop_stage(crop_name_for_manager, planting_date_str)
    daily_plan = generate_action_plan(farm_data, weather_forecast, model1_disease=disease_trigger)

    # Merge into a rich payload the frontend can render directly
    daily_manager_report = {
        "current_stage": {
            "stage_name": stage_info.get("current_stage", "Unknown").title(),
            "day_of_cycle": stage_info.get("current_day", 0),
            "total_days": stage_info.get("total_days", 120),
        },
        "action_plan": {
            "priority": daily_plan.get("status", "On Track"),  # "On Track" or "Critical"
            "report": " | ".join(daily_plan.get("immediate_actions", ["No immediate actions."])),
            "day_tracker": daily_plan.get("day_tracker", ""),
        },
        "financial_warning": daily_plan.get("financial_advisory", ""),
        "immediate_risks": [
            {"risk": action, "severity": "High" if "URGENT" in action else "Medium"}
            for action in daily_plan.get("immediate_actions", [])
            if "No immediate" not in action
        ],
        "raw": daily_plan,  # Keep raw for debugging
    }


    # --- 5. Run Context Bridge — cross-link all features ---
    intelligence = build_intelligence_report(
        disease_result=disease_result,
        land_result=land_result,
        env_risk_result=env_risk_result,
        crop_info=crop_info,
        profit_info=profit_info,
    )

    # Inject the manager model directly into intelligence report for frontend rendering
    intelligence["daily_manager"] = daily_manager_report

    # --- 4b. Build Deep Insights ---
    deep_insights = build_deep_insights(
        land_result=land_result,
        env_risk_result=env_risk_result,
        soil_env=soil_env or {},
        crop_name=crop_info["top_match"]["name"],
        area_acres=area_acres,
        lat=lat,
        lon=lon,
    )

    # --- 6. Assemble unified Intelligence Report ---
    combined_response = {
        # Disease Detection (Computer Vision)
        "disease": {
            "name": disease_result["disease_name"],
            "confidence": disease_result["confidence"],
            "severity": disease_result["severity"],
            "action": disease_result["recommended_action"],
            "image_analyzed": disease_result["image_analyzed"]
        },

        # Land Health (Geospatial / NDVI)
        "land_health": {
            "ndvi": land_result["ndvi_score"],
            "health_score": land_result["health_score"],
            "status": land_result["status"],
            "moisture": land_result["moisture"],
            "organic_carbon": land_result["organic_carbon"],
            "soil_temperature": land_result.get("soil_temperature"),
            "soil_moisture": land_result.get("soil_moisture"),
            "soil_type": land_result.get("soil_type", "Unknown"),
            "data_source": land_result.get("data_source", "unknown"),
        },

        # Soil & NPK
        "soil": {
            "ph": land_result["soil"]["ph"],
            "type": "Loamy" if land_result["soil"]["ph"] < 7.5 else "Alkaline",
            "moisture": land_result["moisture"],
            "organic": land_result["organic_carbon"],
            "score": land_result["health_score"]
        },
        "npk": {
            "n": land_result["soil"]["nitrogen"],
            "p": land_result["soil"]["phosphorus"],
            "k": land_result["soil"]["potassium"]
        },

        # Environmental Risk (Predictive Engine)
        "environment": {
            "risk_level": env_risk_result["risk_level"],
            "risk_percentage": env_risk_result["risk_percentage"],
            "risk_factors": env_risk_result.get("risk_factors", []),
            "advisory": env_risk_result["advisory"],
            "soil_conditions": env_risk_result.get("soil_conditions", {}),
        },
        "weather": env_risk_result["weather"],
        "profit": profit_info,

        # Crop recommendation
        "crop": crop_info,

        # Fertilizer recommendations
        "fertilizer": [
            {"name": f"Urea (N) for {crop_info['top_match']['name']}", "qty": "50 kg/acre", "timing": "At sowing", "icon": "🧪"},
            {"name": "DAP (P)", "qty": "25 kg/acre", "timing": "Basal dose", "icon": "⚗️"},
            {"name": "MOP (K)", "qty": "20 kg/acre", "timing": "At sowing", "icon": "💊"},
        ],

        # ── CONTEXT BRIDGE: Unified Intelligence ──
        "intelligence": intelligence,

        # ── DEEP INSIGHTS: Professional Analysis ──
        "deep_insights": deep_insights,

        # Legacy fields for backward compatibility
        "ndvi": land_result["ndvi_score"],
        "farmer_id": farmer_id,
        "lat": lat,
        "lon": lon,
        "risk_level": env_risk_result["risk_level"],
        "soil_health": land_result["soil"],
        "recommendation": "Maintain moisture levels. NDVI looks optimal." if land_result["ndvi_score"] > 0.5 else "Consider nitrogen fertilization."
    }

    # --- Save to database ---
    if farmer_id:
        add_analysis_record(farmer_id, lat, lon, land_result["ndvi_score"], env_risk_result["risk_level"])

    return jsonify(combined_response), 200

def get_agronomist_response(user_message, language_pref):
    """
    Mock LLM logic. Instructs the AI to act as an expert Indian Agronomist.
    Easily swappable with OpenAI/Gemini API.
    """
    system_prompt = f"""
    You are an expert Indian Agronomist. Your goal is to provide high-quality, 
    practical agricultural advice to farmers in India. 
    You are knowledgeable in:
    - Crop health and disease prevention.
    - Modern farming techniques (Precision farming, Hydroponics).
    - Government Schemes like PM-KISAN, PM Fasal Bima Yojana, and Soil Health Card.
    - Sustainable and organic farming practices.
    
    Please provide the response in {language_pref}.
    Keep advice culturally relevant and scientifically accurate.
    """
    
    # MOCK RESPONSE (Placeholder for real API call)
    mock_expert_answer = f"Namaste! For your question regarding '{user_message}', as an Agronomist, I suggest focusing on crop rotation and ensuring your Soil Health Card parameters are checked. Under PM-KISAN, you might be eligible for financial aid to support these improvements."
    
    return {
        "system_prompt_used": system_prompt,
        "answer": mock_expert_answer
    }


@app.route('/chat', methods=['POST'])
def chat():
    """
    AI Agronomist Chat API endpoint.
    Expects JSON: { user_message, language_pref? }
    """
    data = request.get_json() or {}
    user_message = data.get('user_message', '').strip()
    language_pref = data.get('language_pref', 'English')
    if not user_message:
        return jsonify({"error": "user_message is required"}), 400
    response = get_agronomist_response(user_message, language_pref)
    return jsonify(response), 200


@app.route('/api/market/add', methods=['POST'])
def market_add():
    """
    Add a new marketplace listing.
    Expects JSON: { farmer_id, crop_name, expected_yield_kg, price_per_kg, harvest_date }
    """
    data = request.get_json() or {}
    farmer_id = data.get('farmer_id', 1)
    crop_name = data.get('crop_name')
    expected_yield_kg = data.get('expected_yield_kg', 0)
    price_per_kg = data.get('price_per_kg', 0)
    harvest_date = data.get('harvest_date', '')

    if not crop_name:
        return jsonify({"error": "crop_name is required"}), 400

    listing_id = add_market_listing(farmer_id, crop_name, expected_yield_kg, price_per_kg, harvest_date)
    return jsonify({
        "status": "success",
        "message": "Market listing added successfully",
        "listing_id": listing_id
    }), 201


@app.route('/api/market/view', methods=['GET'])
def market_view():
    """
    Retrieve all active marketplace listings.
    """
    listings = get_all_market_listings()
    return jsonify({
        "status": "success",
        "listings": listings
    }), 200


@app.route('/api/mandi/prices', methods=['GET'])
def get_mandi_prices():
    """
    Returns simulated live Mandi prices from the extended crop database.
    Supports ?search= and ?origin= (India or Global)
    """
    search_query = request.args.get('search', '').lower()
    origin_filter = request.args.get('origin', '').lower() # 'india' or 'global'

    db_path = os.path.join(os.path.dirname(__file__), 'crop_database.json')
    if not os.path.exists(db_path):
        return jsonify({"error": "Database not initialized"}), 500

    import json
    with open(db_path, 'r', encoding='utf8') as f:
        all_crops = json.load(f)

    filtered = []
    for c in all_crops:
        # Search filter
        matches_search = (not search_query) or (search_query in c["name_en"].lower()) or (search_query in c["name_hi"])
        
        # Origin filter
        matches_origin = True
        if origin_filter == 'india':
            matches_origin = c["is_indian"]
        elif origin_filter == 'global':
            matches_origin = not c["is_indian"]

        if matches_search and matches_origin:
            m = c["market_data"]
            filtered.append({
                "crop_en": c["name_en"],
                "crop_hi": c["name_hi"] or c["name_en"],
                "icon": c["icon"],
                "origin": c["origin"],
                "mandi_str": f"₹{m['mandi_price']:,}/q",
                "ai_str": f"₹{m['ai_price']:,}/q",
                "trend": m["trend"],
                "change": m["change"]
            })

    # Return top 50 to avoid massive payloads
    return jsonify(filtered[:50]), 200


@app.route('/api/crop/recommend', methods=['POST'])
def crop_recommend():
    """
    Enhanced recommendation using the 1000+ crop database.
    Supports dual tabs: Indian vs Foreign.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Environmental/Soil inputs
    try:
        N = float(data.get('N', 50))
        P = float(data.get('P', 50))
        K = float(data.get('K', 50))
        ph = float(data.get('ph', 6.5))
        temp = float(data.get('temperature', 25))
        hum = float(data.get('humidity', 60))
        rain = float(data.get('rainfall', 800))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numeric input"}), 400

    db_path = os.path.join(os.path.dirname(__file__), 'crop_database.json')
    import json
    with open(db_path, 'r', encoding='utf8') as f:
        all_crops = json.load(f)

    # Scoring logic: find crops whose growth_params match closest
    def get_suitability_score(crop):
        gp = crop["growth_params"]
        score = 0
        # Temp check
        if gp["temp_range"][0] <= temp <= gp["temp_range"][1]: score += 20
        # Humidity check
        if gp["humidity_range"][0] <= hum <= gp["humidity_range"][1]: score += 20
        # PH check
        if gp["ph_range"][0] <= ph <= gp["ph_range"][1]: score += 20
        # Rainfall check (within 30%)
        if abs(gp["rainfall_mm"] - rain) / gp["rainfall_mm"] < 0.3: score += 20
        
        # Nutrient match (normalized)
        item_npk = gp["npk_preferred"]
        npk_diff = (abs(item_npk[0]-N) + abs(item_npk[1]-P) + abs(item_npk[2]-K)) / 3
        score += max(0, 20 - (npk_diff/10))
        
        return score

    indian_recs = []
    foreign_recs = []

    for c in all_crops:
        suitability = get_suitability_score(c)
        if suitability > 50: # Only recommend somewhat suitable crops
            rec = {
                "name": c["name_en"],
                "name_hi": c["name_hi"],
                "confidence": f"{suitability}%",
                "origin": c["origin"],
                "profit": f"₹{c['market_data']['ai_price'] * 15:,}", # simulated per acre
                "icon": c["icon"],
                "water": "High" if c["growth_params"]["rainfall_mm"] > 1000 else ("Low" if c["growth_params"]["rainfall_mm"] < 500 else "Medium")
            }
            if c["is_indian"]:
                indian_recs.append(rec)
            else:
                foreign_recs.append(rec)

    # Sort by confidence
    indian_recs.sort(key=lambda x: float(x["confidence"].replace('%', '')), reverse=True)
    foreign_recs.sort(key=lambda x: float(x["confidence"].replace('%', '')), reverse=True)

    return jsonify({
        "indian": indian_recs[:5],
        "foreign": foreign_recs[:5],
        "environment_context": {
            "air_humidity": f"{hum}%",
            "temperature": f"{temp}°C",
            "soil_ph": ph
        }
    }), 200


@app.route('/api/farm/locate', methods=['POST'])
def farm_locate():
    """
    Save farm location drawn by the user on the Locate Farm map.
    Expects JSON: { farmer_id, farm_name, state, district, soil_type,
                    season, irrigation, area_acres, area_hectares, coordinates }
    Returns: { status, farm_id }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    farmer_id    = data.get('farmer_id', 1)
    farm_name    = data.get('farm_name', 'My Farm')
    state        = data.get('state', '')
    district     = data.get('district', '')
    soil_type    = data.get('soil_type', 'Loamy')
    season       = data.get('season', '')
    irrigation   = data.get('irrigation', '')
    area_acres   = float(data.get('area_acres', 0))
    area_hectares = float(data.get('area_hectares', 0))
    coordinates  = data.get('coordinates', '[]')

    farm_id = save_farm_location(
        farmer_id, farm_name, state, district,
        soil_type, season, irrigation,
        area_acres, area_hectares, coordinates
    )

    return jsonify({
        "status": "success",
        "message": "Farm location saved successfully",
        "farm_id": farm_id,
        "farm_name": farm_name,
        "area_acres": area_acres,
    }), 201


@app.route('/api/analyze_soil', methods=['POST'])
def analyze_soil():
    """
    Simulates a 'Virtual Soil Test' based on GPS coordinates.
    Uses 'Satellite Remote Sensing' logic to return simulated NPK, moisture and score.
    """
    data = request.get_json()
    lat = data.get('lat', 18.5204)  # Default to Pune lat
    lon = data.get('lon', 73.8567)  # Default to Pune lon

    # Simulate random variations based on "satellite precision"
    # In a real app, this would query a Soil Grid API or satellite data provider
    npk_n = round(60 + (lat % 1) * 20 + (lon % 1) * 5) % 100
    npk_p = round(40 + (lat % 1) * 15) % 100
    npk_k = round(75 + (lon % 1) * 10) % 100
    moisture = round(50 + (lat % 1) * 30) % 100
    health_score = round((npk_n + npk_p + npk_k + moisture) / 4)

    return jsonify({
        "status": "success",
        "method": "Remote Sensing (Satellite)",
        "coordinates": {"lat": lat, "lon": lon},
        "score": health_score,
        "n": npk_n,
        "p": npk_p,
        "k": npk_k,
        "moisture": moisture,
        "soil_type": "Loamy/Black Soil",
        "ph": 6.8,
        "status_label": "Good" if health_score > 70 else "Fair"
    }), 200

# ── WhatsApp Webhook Endpoints ───────────────────────────────────────────────

@app.route('/api/whatsapp/webhook', methods=['POST'])
def whatsapp_webhook():
    """
    Twilio WhatsApp Webhook
    Handles incoming messages (Text & Media).
    """
    incoming_msg = request.values.get('Body', '').strip()
    sender_number = request.values.get('From', '') # e.g. "whatsapp:+14155238886"
    num_media = int(request.values.get('NumMedia', 0))

    # Strip the whatsapp: prefix for database storage
    phone_clean = sender_number.replace('whatsapp:', '')
    
    # Try inserting as a new farmer; if it fails due to UNIQUE constraint, they exist
    user_id = insert_farmer(name="WhatsApp Farmer", phone=phone_clean)
    
    is_new_user = user_id is not None
    
    # Handle Media (Image)
    if num_media > 0:
        media_url = request.values.get('MediaUrl0')
        # Download image securely resolving to local folder
        try:
            image_response = requests.get(media_url, timeout=10)
            safe_name = f"whatsapp_{uuid.uuid4().hex[:8]}.jpg"
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            image_path = os.path.join(UPLOAD_FOLDER, safe_name)
            with open(image_path, 'wb') as f:
                f.write(image_response.content)

            # Run Disease Detection Pipeline
            disease_result = predict_disease(image_path)
            
            # Map dict result cleanly
            reply_text = (
                f"🔍 *AI Farm Analyzer Result*\n\n"
                f"Crop Status: {disease_result.get('disease_name', 'Unknown')}\n"
                f"Severity: {disease_result.get('severity', 'None')}\n"
                f"Action Required: {disease_result.get('recommended_action', 'None')}"
            )
        except Exception as e:
            print("Webhook Image Fetch Error:", e)
            reply_text = "⚠️ Sorry, I could not download or process your image right now. Please try again later!"
    else:
        # Handle Text message via existing AI Chat logic
        ai_response = get_agronomist_response(incoming_msg, "(Hindi or English, whatever is natural)")
        reply_text = ai_response.get("answer", "I could not process your query.")

    # Welcome Message Injection for newly registered users
    if is_new_user:
        welcome_msg = (
            "Jai Kisan! 🌾 Welcome to SmartFarm AI on WhatsApp.\n"
            "Send a photo of your crop or field for instant AI analysis, "
            "or ask me anything about farming in Hindi or English!\n\n"
        )
        reply_text = welcome_msg + reply_text

    # Construct Twilio TwiML Response
    xml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{reply_text}</Message>
</Response>"""
    
    from flask import Response
    return Response(xml_response, mimetype="application/xml")


@app.route('/api/harvest-predictor/predict', methods=['POST'])
def auto_predict_harvest():
    data = request.get_json()
    crop = data.get('crop')
    district = data.get('district', 'Pune')
    harvest_date = data.get('harvest_date')
    farm_size_acres = data.get('farm_size_acres', 0)
    
    if not all([crop, harvest_date]):
        return jsonify({"error": "Missing crop or harvest_date"}), 400
        
    result = predict_harvest_price(crop, harvest_date, district, farm_size_acres)
    return jsonify(result), 200

@app.route('/api/harvest-predictor/save', methods=['POST'])
def save_harvest_prediction():
    data = request.get_json()
    farmer_id = data.get("farmer_id", 1)  # stub
    record_id = save_prediction(
        farmer_id=farmer_id,
        crop=data.get("crop"),
        district=data.get("district"),
        harvest_date=data.get("harvest_date"),
        farm_size_acres=data.get("farm_size_acres"),
        predicted_price=data.get("predicted_price"),
        confidence=data.get("confidence"),
        total_revenue_estimate=data.get("total_revenue_estimate")
    )
    return jsonify({"success": True, "record_id": record_id}), 201

@app.route('/api/harvest-predictor/history/<int:farmer_id>', methods=['GET'])
def get_prediction_history(farmer_id):
    records = get_predictions(farmer_id)
    return jsonify({"predictions": records}), 200

@app.route('/api/farming-techniques', methods=['POST'])
def get_farming_techniques():
    """
    Generates 12 hyper-local farming techniques based on farmer profile.
    Uses a rich mock dataset styled for Maharashtra farmers.
    Easily swappable with real Claude API.
    """
    data = request.get_json() or {}
    district = data.get('district', 'Pune')
    soil_type = data.get('soil_type', 'Loamy')
    season = data.get('season', 'Rabi')
    crops = data.get('crops', ['Wheat'])
    farm_size = data.get('farm_size', 5)
    current_month = data.get('current_month', 3)

    crop_str = ', '.join(crops) if crops else 'Wheat'

    # Comprehensive hyper-local techniques bank
    techniques = [
        {
            "id": 1, "title": "Drip Irrigation Micro-Scheduling",
            "category": "Water Management", "difficulty": "Medium",
            "impact": "High", "time_to_implement": "3-5 days",
            "description": f"Install drip lines 30cm apart for {crop_str} fields in {district}. Programme irrigation cycles to run between 5-7 AM when evaporation is lowest. Reduce water usage by 40% vs flood irrigation while maintaining optimal root-zone moisture for {season} conditions.",
            "local_context": f"In {district}, groundwater tables drop 2-3m by February — drip scheduling preserves your bore-well for the entire {season} season.",
            "materials_needed": ["Drip laterals 16mm", "Pressure regulator", "Filter unit", "Timer controller", "Mulching film"],
            "expected_benefit": "35-40% water saving, 15% yield increase",
            "best_time": f"Install before {season} sowing begins", "warning": None
        },
        {
            "id": 2, "title": f"{soil_type} Soil Carbon Enrichment",
            "category": "Soil Health", "difficulty": "Easy",
            "impact": "High", "time_to_implement": "1 day",
            "description": f"Apply 2 tonnes of farm yard manure (FYM) per acre to your {soil_type} fields before {crop_str} sowing. Mix with 50kg vermicompost per acre and deep-plough to 20cm. This builds stable soil organic carbon which improves water retention in {district}'s black/red soil profiles.",
            "local_context": f"{district} soils test at 0.3-0.5% organic carbon — Maharashtra agriculture department recommends 0.8% minimum for stable {crop_str} yield.",
            "materials_needed": ["Farm Yard Manure", "Vermicompost", "Rotavator access", "Soil test kit", "pH meter"],
            "expected_benefit": "20-25% improvement in soil water holding, 12% yield boost",
            "best_time": "3 weeks before sowing", "warning": "Do not mix FYM with urea on the same day"
        },
        {
            "id": 3, "title": f"IPM for {crop_str} in {season}",
            "category": "Pest Control", "difficulty": "Medium",
            "impact": "High", "time_to_implement": "2-3 days",
            "description": f"Integrated Pest Management for {crop_str} in {district}: Install 5 yellow sticky traps per acre at crop canopy level. Apply neem-based insecticide (Azadirachtin 0.03%) at 3mL/L every 10 days. Release Trichogramma cards (1.5 lakh eggs/acre) for stem borer control.",
            "local_context": f"{district} district sees peak aphid pressure in {season} around week 6 of crop growth — early trap monitoring prevents 30-40% spray cost.",
            "materials_needed": ["Yellow sticky traps", "Azadirachtin 0.03% EC", "Trichogramma cards", "Sprayer pump", "Protective gloves"],
            "expected_benefit": "40-50% reduction in chemical spray cost",
            "best_time": "Begin at vegetative stage (3-4 weeks after sowing)", "warning": "Do not spray neem oil after 10 AM — UV degrades active ingredient"
        },
        {
            "id": 4, "title": "Raised Bed Planting for Drainage",
            "category": "Water Management", "difficulty": "Easy",
            "impact": "Medium", "time_to_implement": "1 day",
            "description": f"Form raised beds 15cm high and 90cm wide for {crop_str} in heavier {soil_type} pockets of your {district} farm. This prevents waterlogging root-zone in December-January rains, reduces soil compaction, and improves aeration for root development during {season}.",
            "local_context": f"Low-lying {district} plots flood for 12-18 hours during unseasonal December rain — raised beds reduce crop loss by up to 60% in these micro-plots.",
            "materials_needed": ["Bed shaper attachment", "Tractor access", "Measuring rope", "Drainage channels"],
            "expected_benefit": "60% reduction in waterlogging loss, better root aeration",
            "best_time": "Form beds 1 week before sowing", "warning": None
        },
        {
            "id": 5, "title": "Split Nitrogen Application Protocol",
            "category": "Fertilization", "difficulty": "Easy",
            "impact": "High", "time_to_implement": "Ongoing (3 doses)",
            "description": f"Split urea application for {crop_str} into 3 doses: 1/3 at sowing (basal), 1/3 at tillering (25 days), 1/3 at jointing (45 days). This matches nitrogen availability to crop uptake curve, reducing leaching losses in {district}'s sandy-loam zones.",
            "local_context": f"{district} soils lose up to 35% applied nitrogen through leaching in a single dose — 3-split application increases nitrogen use efficiency to 78% vs 52%.",
            "materials_needed": ["Urea (46-0-0)", "DAP (18-46-0)", "Broadcaster or drill", "Moisture meter"],
            "expected_benefit": "18-22% increase in grain yield, 25% reduction in nitrogen cost",
            "best_time": "First dose at sowing; track 25-day intervals", "warning": "Never apply urea to wet soil — wait for surface crust to dry"
        },
        {
            "id": 6, "title": "Mulching for Summer Moisture Retention",
            "category": "Climate Adaptation", "difficulty": "Easy",
            "impact": "Medium", "time_to_implement": "1-2 days",
            "description": f"Apply 8-10 cm thick crop residue mulch (previous season's wheat/rice straw) between {crop_str} rows after second irrigation. Mulching reduces soil surface temperature by 5-8°C, cuts evaporation by 50%, and suppresses weed germination in {district}'s April-May heat.",
            "local_context": f"In {district}, May temperatures cross 40°C — mulched plots retain adequate moisture 12 days longer between irrigations vs bare soil.",
            "materials_needed": ["Crop residue / straw", "Chopper machine", "Labour (2 persons/acre)", "Mulching film (optional)"],
            "expected_benefit": "50% reduction in summer irrigation frequency",
            "best_time": "After first irrigation post-sowing", "warning": None
        },
        {
            "id": 7, "title": f"{crop_str}–Legume Intercropping",
            "category": "Crop Rotation", "difficulty": "Medium",
            "impact": "High", "time_to_implement": "At sowing",
            "description": f"Grow one row of moong (green gram) for every 4 rows of {crop_str}. Moong fixes 40-60 kg atmospheric nitrogen per acre, reducing your urea requirement. After moong harvest, the standing biomass can be incorporated as green manure enriching your {soil_type} soil.",
            "local_context": f"{district} farmers intercropping moong with soybean have reported ₹6,000-8,000 additional income per acre and 18% lower input cost in the following Rabi season.",
            "materials_needed": ["Certified moong seed", "Rhizobium culture inoculant", "Planter (6-row)"],
            "expected_benefit": "₹6,000-8,000 additional income per acre per season",
            "best_time": "Sow simultaneously with main crop", "warning": "Ensure moong variety matures 20 days before main crop harvest"
        },
        {
            "id": 8, "title": "Soil Solarisation for Disease Control",
            "category": "Soil Health", "difficulty": "Easy",
            "impact": "Medium", "time_to_implement": "21-30 days",
            "description": f"Cover prepared field with 25-micron transparent plastic during April-May before {season} sowing. Solar radiation raises soil temperature to 50-60°C at 5cm depth, killing Fusarium, Pythium and other soil-borne pathogens common in {district}'s continuous {crop_str} fields.",
            "local_context": f"Continuous {crop_str} cultivation in {district} for 3+ years builds up take-all root rot — solarisation reduces pathogen load by 80-90%, equivalent to 2 fungicide drenches.",
            "materials_needed": ["25-micron transparent plastic", "Irrigation for wetting soil", "Bamboo stakes"],
            "expected_benefit": "80-90% reduction in soil-borne disease pressure",
            "best_time": "April–May (peak solar radiation month)", "warning": None
        },
        {
            "id": 9, "title": "Post-Harvest Residue Management",
            "category": "Post-Harvest", "difficulty": "Easy",
            "impact": "Medium", "time_to_implement": "2-3 days",
            "description": f"After {crop_str} harvest, chop residue with rotavator to 5-8cm pieces and incorporate into top 15cm of {soil_type} soil. Apply urea at 10 kg/acre to accelerate decomposition. This returns 40-60 kg NPK per acre to soil, reducing your next season fertiliser input.",
            "local_context": f"Burning {crop_str} residue (common in {district}) destroys 90% of surface soil microbes — incorporation increases soil microbial biomass 3x within 60 days.",
            "materials_needed": ["Rotavator", "Urea (10 kg/acre)", "2-3 months decomposition window"],
            "expected_benefit": "₹2,500-3,500 saved on next season fertiliser bill",
            "best_time": "Within 48 hours of harvest", "warning": "Do not incorporate residue if disease pressure was high — burn and treat instead"
        },
        {
            "id": 10, "title": "Micronutrient Boron + Zinc Application",
            "category": "Fertilization", "difficulty": "Easy",
            "impact": "High", "time_to_implement": "1 day (spray)",
            "description": f"Spray zinc sulphate (0.5%) at vegetative stage and borax (0.2%) at flowering stage for {crop_str}. Zinc and boron deficiency causes grain shrivelling and poor pollination, common in {district}'s calcareous soils. Foliar spray is 5x more efficient than soil application.",
            "local_context": f"Soil testing in {district} talukas shows 65% fields are zinc-deficient — a single foliar zinc spray at tillering adds 8-12% to grain weight in {crop_str}.",
            "materials_needed": ["Zinc Sulphate (21%)", "Borax technical grade", "Sticking agent", "Knapsack sprayer"],
            "expected_benefit": "8-15% increase in grain weight and quality",
            "best_time": "Zinc: vegetative stage; Boron: early flowering", "warning": "Do not mix boron and calcium in same spray tank"
        },
        {
            "id": 11, "title": f"Mechanised Precision Harvesting for {farm_size}-Acre Farm",
            "category": "Harvesting", "difficulty": "Medium",
            "impact": "High", "time_to_implement": "1-2 days",
            "description": f"Hire PACS-registered combine harvester calibrated for {crop_str} variety used in {district}. Set concave clearance and cylinder speed correctly for minimised grain damage. Harvest at 14-15% moisture content for {crop_str} — harvesting too early or late causes 5-8% field loss.",
            "local_context": f"{district} ATMA (Agriculture Technology Management Agency) provides combine subsidy to farmer producer groups — contact district office for booking 2-3 weeks before harvest date.",
            "materials_needed": ["Booked combine harvester", "Moisture meter", "Gunny bags", "Transport vehicle"],
            "expected_benefit": "Reduce harvest losses from 8% to under 2%",
            "best_time": "When grain moisture reads 14-16%", "warning": "Do not harvest after unseasonal rain — wait 2 days for field drying"
        },
        {
            "id": 12, "title": f"Climate-Smart Variety Selection for Next {season}",
            "category": "Climate Adaptation", "difficulty": "Easy",
            "impact": "High", "time_to_implement": "Planning phase",
            "description": f"Switch to heat-tolerant, drought-resistant varieties available through Mahatma Phule Krishi Vidyapeeth (MPKV) Rahuri. For {district}'s current climate trajectory, varieties with 10-15 day shorter maturity reduce terminal drought risk by 30-40% without sacrificing yield potential.",
            "local_context": f"{district} has seen 8-10 day shift in monsoon withdrawal over last decade — short-duration varieties like NW-1014 (wheat) or MAUS-71 (soybean) are bred specifically for this changing pattern in Marathwada/Western Maharashtra.",
            "materials_needed": ["MPKV certified seed", "Seed treatment (thiram + carbendazim)", "Updated agronomic calendar"],
            "expected_benefit": "30-40% reduction in terminal drought risk",
            "best_time": "Order seeds 6 weeks before sowing", "warning": None
        }
    ]

    # Pick most urgent technique based on season
    urgent_map = {"Kharif": 3, "Rabi": 5, "Zaid": 6}
    urgent_id = urgent_map.get(season, 5)
    featured = next((t for t in techniques if t["id"] == urgent_id), techniques[0])

    return jsonify({
        "techniques": techniques,
        "featured": featured,
        "context": {
            "district": district,
            "soil_type": soil_type,
            "season": season,
            "crops": crops,
            "farm_size": farm_size
        }
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

