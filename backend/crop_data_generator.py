import json
import random

# Core 15 Valid Indian Crops
INDIAN_CROPS = [
    {
        "en": "Wheat", "hi": "गेहूं", "cat": "Cereals", "icon": "🌾",
        "temp": [10, 25], "hum": [40, 70], "ph": [6.0, 7.5], "rain": 500, "npk": [120, 60, 40], "price": 2275
    },
    {
        "en": "Rice (Paddy)", "hi": "धान", "cat": "Cereals", "icon": "🍚",
        "temp": [20, 35], "hum": [60, 90], "ph": [5.5, 6.5], "rain": 1200, "npk": [100, 50, 50], "price": 2183
    },
    {
        "en": "Soybean", "hi": "सोयाबीन", "cat": "Oilseeds", "icon": "🫘",
        "temp": [20, 30], "hum": [50, 75], "ph": [6.0, 7.0], "rain": 800, "npk": [20, 80, 40], "price": 4600
    },
    {
        "en": "Maize", "hi": "मक्का", "cat": "Cereals", "icon": "🌽",
        "temp": [18, 27], "hum": [55, 80], "ph": [5.8, 7.5], "rain": 650, "npk": [120, 60, 40], "price": 2090
    },
    {
        "en": "Onion", "hi": "प्याज", "cat": "Vegetables", "icon": "🧅",
        "temp": [15, 25], "hum": [60, 75], "ph": [6.5, 7.5], "rain": 400, "npk": [100, 50, 50], "price": 2500
    },
    {
        "en": "Tomato", "hi": "टमाटर", "cat": "Vegetables", "icon": "🍅",
        "temp": [20, 28], "hum": [60, 85], "ph": [6.0, 7.0], "rain": 600, "npk": [120, 60, 60], "price": 3000
    },
    {
        "en": "Chilli", "hi": "मिर्च", "cat": "Spices", "icon": "🌶️",
        "temp": [20, 30], "hum": [50, 70], "ph": [6.5, 7.5], "rain": 800, "npk": [120, 60, 60], "price": 7500
    },
    {
        "en": "Mustard", "hi": "सरसों", "cat": "Oilseeds", "icon": "🌻",
        "temp": [10, 25], "hum": [40, 65], "ph": [6.0, 7.5], "rain": 400, "npk": [60, 40, 40], "price": 5450
    },
    {
        "en": "Sugarcane", "hi": "गन्ना", "cat": "Cash Crop", "icon": "🎋",
        "temp": [20, 35], "hum": [65, 90], "ph": [6.5, 7.5], "rain": 1500, "npk": [250, 100, 100], "price": 3150
    },
    {
        "en": "Cotton", "hi": "कपास", "cat": "Commercial", "icon": "☁️",
        "temp": [25, 35], "hum": [50, 80], "ph": [6.0, 8.0], "rain": 900, "npk": [120, 60, 60], "price": 6620
    },
    {
        "en": "Potato", "hi": "आलू", "cat": "Vegetables", "icon": "🥔",
        "temp": [15, 25], "hum": [60, 85], "ph": [5.5, 6.5], "rain": 500, "npk": [150, 100, 100], "price": 1800
    },
    {
        "en": "Chickpea (Chana)", "hi": "चना", "cat": "Legumes", "icon": "🫛",
        "temp": [10, 25], "hum": [40, 65], "ph": [6.0, 7.5], "rain": 400, "npk": [20, 60, 20], "price": 5335
    },
    {
        "en": "Moong Dal", "hi": "मूंग दाल", "cat": "Legumes", "icon": "🌿",
        "temp": [25, 35], "hum": [50, 80], "ph": [6.5, 7.5], "rain": 600, "npk": [20, 40, 20], "price": 8558
    },
    {
        "en": "Jowar", "hi": "ज्वार", "cat": "Cereals", "icon": "🌾",
        "temp": [25, 35], "hum": [40, 60], "ph": [6.0, 8.5], "rain": 450, "npk": [80, 40, 40], "price": 3180
    },
    {
        "en": "Bajra", "hi": "बाजरा", "cat": "Cereals", "icon": "🌾",
        "temp": [25, 35], "hum": [40, 60], "ph": [6.5, 8.0], "rain": 350, "npk": [60, 40, 20], "price": 2500
    }
]

def generate_crop_database():
    database = []
    
    for i, item in enumerate(INDIAN_CROPS):
        crop_data = {
            "id": i + 1,
            "name_en": item["en"],
            "name_hi": item["hi"],
            "category": item["cat"],
            "icon": item["icon"],
            "origin": "India",
            "is_indian": True,
            "growth_params": {
                "temp_range": item["temp"],
                "humidity_range": item["hum"],
                "ph_range": item["ph"],
                "rainfall_mm": item["rain"],
                "npk_preferred": item["npk"]
            },
            "market_data": {
                "mandi_price": item["price"],
                "ai_price": item["price"] + random.randint(-150, 300),
                "trend": random.choice(["up", "stable", "up", "up"]),  # mostly positive
                "change": f"{random.uniform(1.0, 8.0):.1f}%"
            }
        }
        database.append(crop_data)
        
    return database

if __name__ == "__main__":
    db = generate_crop_database()
    with open("c:/Users/Vipul Bhamare/Downloads/SmartFarmAI_Project/backend/crop_database.json", "w", encoding='utf8') as f:
        json.dump(db, f, indent=4, ensure_ascii=False)
    print(f"Generated {len(db)} exact Indian crops without varieties in crop_database.json")
