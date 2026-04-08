import csv
import json
import os
import random

CSV_PATH = r"c:\Users\ARYAN - AYUSH\Downloads\large_crop_dataset.csv"
JSON_PATH = os.path.join(os.path.dirname(__file__), "crop_database.json")

# Mapping Dictionaries
SOIL_PH_MAP = {
    "Peaty": [4.5, 5.5],
    "Clay": [6.0, 7.5],
    "Sandy Loam": [5.5, 6.5],
    "Loamy": [6.0, 7.0],
    "Silt": [6.0, 7.0],
    "Well-drained": [6.0, 7.5],
}

WEATHER_MAP = {
    "Hot": {"temp": [28, 40], "humidity": [30, 50]},
    "Hot and Humid": {"temp": [25, 35], "humidity": [70, 90]},
    "Warm": {"temp": [20, 30], "humidity": [40, 60]},
    "Cool": {"temp": [10, 25], "humidity": [50, 70]},
    "Temperate": {"temp": [10, 25], "humidity": [50, 70]},
    "Dry": {"temp": [25, 40], "humidity": [15, 30]},
}

WATER_MAP = {
    "High": 1500,
    "Medium": 900,
    "Low": 400,
}

CROP_ICONS = {
    "Garlic": "🧄",
    "Carrot": "🥕",
    "Wheat": "🌾",
    "Corn": "🌽",
    "Rice": "🍚",
    "Grapes": "🍇",
    "Soybean": "🫘",
    "Tea": "🍵",
    "Peanut": "🥜",
    "Cocoa": "🍫",
    "Sugarcane": "🎋",
    "Apple": "🍎",
    "Sunflower": "🌻",
    "Cotton": "☁️",
    "Potato": "🥔",
    "Oats": "🥣",
    "Pineapple": "🍍",
    "Banana": "🍌",
    "Canola": "🌼",
    "Barley": "🌾",
    "Millet": "🌾",
    "Coffee": "☕",
    "Orange": "🍊",
    "Lentil": "🫘",
    "Maize": "🌽",
    "Mango": "🥭",
    "Chickpea": "🫘",
    "Mustard": "🌼",
    "Tomato": "🍅",
    "Onion": "🧅",
}

CROP_HINDI_MAP = {
    "Garlic": "लहसुन",
    "Carrot": "गाजर",
    "Wheat": "गेहूं",
    "Corn": "मक्का",
    "Rice": "चावल",
    "Grapes": "अंगूर",
    "Soybean": "सोयाबीन",
    "Tea": "चाय",
    "Peanut": "मूंगफली",
    "Cocoa": "कोको",
    "Sugarcane": "गन्ना",
    "Apple": "सेब",
    "Sunflower": "सूरजमुखी",
    "Cotton": "कपास",
    "Potato": "आलू",
    "Oats": "जई",
    "Pineapple": "अनानास",
    "Banana": "केला",
    "Canola": "कनोला",
    "Barley": "जौ",
    "Millet": "बाजरा",
    "Coffee": "कॉफी",
    "Orange": "संतरा",
    "Lentil": "मसूर",
    "Maize": "मक्का",
    "Mango": "आम",
    "Chickpea": "चना",
    "Mustard": "सरसों",
    "Tomato": "टमाटर",
    "Onion": "प्याज़",
}

def migrate():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    with open(JSON_PATH, "r", encoding="utf8") as f:
        existing_db = json.load(f)

    last_id = existing_db[-1]["id"] if existing_db else 0
    new_crops = []

    with open(CSV_PATH, "r", encoding="utf8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            crop_name = row["crop_name"].strip()
            origin = row["origin"].strip()
            suitable_soil = row["suitable_soil"].strip()
            suitable_weather = row["suitable_weather"].strip()
            season = row["season"].strip()
            water_req = row["water_requirements"].strip()

            last_id += 1
            
            ph_range = SOIL_PH_MAP.get(suitable_soil, [6.0, 7.0])
            weather = WEATHER_MAP.get(suitable_weather, {"temp": [20, 30], "humidity": [40, 60]})
            rainfall = WATER_MAP.get(water_req, 800)
            
            # Add some randomness to numerical values to avoid perfect overlap
            ph_range = [round(ph_range[0] + random.uniform(-0.2, 0.2), 1), round(ph_range[1] + random.uniform(-0.2, 0.2), 1)]
            temp_range = [round(weather["temp"][0] + random.uniform(-2, 2), 1), round(weather["temp"][1] + random.uniform(-2, 2), 1)]
            hum_range = [round(weather["humidity"][0] + random.uniform(-5, 5), 1), round(weather["humidity"][1] + random.uniform(-5, 5), 1)]
            rainfall = int(rainfall + random.uniform(-50, 50))

            mandi_price = random.randint(1500, 6000)
            ai_price = mandi_price + random.randint(-100, 300)

            crop_entry = {
                "id": last_id,
                "name_en": f"{crop_name} ({origin})",
                "name_hi": CROP_HINDI_MAP.get(crop_name, ""),
                "category": "CSV Import",
                "icon": CROP_ICONS.get(crop_name, "🌱"),
                "origin": origin,
                "is_indian": origin.lower() == "india",
                "growth_params": {
                    "temp_range": temp_range,
                    "humidity_range": hum_range,
                    "ph_range": ph_range,
                    "rainfall_mm": rainfall,
                    "npk_preferred": [random.randint(40, 100), random.randint(20, 50), random.randint(20, 80)]
                },
                "market_data": {
                    "mandi_price": mandi_price,
                    "ai_price": ai_price,
                    "trend": random.choice(["up", "down", "stable"]),
                    "change": f"{random.uniform(0.5, 10.0):.1f}%"
                }
            }
            new_crops.append(crop_entry)

    existing_db.extend(new_crops)

    with open(JSON_PATH, "w", encoding="utf8") as f:
        json.dump(existing_db, f, indent=4, ensure_ascii=False)

    print(f"Successfully migrated {len(new_crops)} crops. Total crops in database: {len(existing_db)}")

if __name__ == "__main__":
    migrate()
