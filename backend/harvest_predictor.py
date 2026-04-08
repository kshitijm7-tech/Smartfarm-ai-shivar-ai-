import datetime
import random
import requests

CACHE = {}

def get_historical_data(crop, district):
    cache_key = f"{crop}_{district}"
    if cache_key in CACHE:
        data, timestamp = CACHE[cache_key]
        if (datetime.datetime.now() - timestamp).total_seconds() < 24 * 3600:
            return data

    API_KEY = "dummy"
    url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={API_KEY}&format=json&filters[commodity]={crop}&filters[district]={district}"
    
    mock_data = generate_mock_historical_data(crop)
    try:
        res = requests.get(url, timeout=2)
        if res.status_code == 200:
            # We would parse true API data here, but data.gov.in is mocked for hackathon
            pass
    except Exception:
        pass
        
    CACHE[cache_key] = (mock_data, datetime.datetime.now())
    return mock_data

def generate_mock_historical_data(crop):
    # Generates 36 months of data
    baselines = {
        "Wheat": 2200, "Rice": 2800, "Sugarcane": 300, 
        "Onion": 1500, "Tomato": 1800, "Cotton": 6500, 
        "Soybean": 4500, "Maize": 2100
    }
    base = baselines.get(crop, 2000)
    data = []
    today = datetime.date.today()
    import math
    for i in range(36):
        month_date = today - datetime.timedelta(days=30 * (36 - i - 1))
        season = math.sin((month_date.month / 12.0) * 2 * math.pi) * (base * 0.2)
        noise = random.randint(-int(base * 0.1), int(base * 0.1))
        price = max(base * 0.5, base + season + noise)
        data.append({"date": month_date.strftime("%Y-%m-%d"), "price": round(price)})
    return data

def predict_harvest_price(crop, harvest_date_str, district, farm_size_acres):
    hist_data = get_historical_data(crop, district)
    
    harvest_date = datetime.datetime.strptime(harvest_date_str, "%Y-%m-%d").date()
    harvest_month = harvest_date.month
    
    # Layer 1 - Seasonal Baseline
    same_month_prices = [d["price"] for d in hist_data if datetime.datetime.strptime(d["date"], "%Y-%m-%d").month == harvest_month]
    if same_month_prices:
        baseline = sum(same_month_prices) / len(same_month_prices)
    else:
        baseline = hist_data[-1]["price"]
        
    # Layer 2 - Trend Adjustment (last 30 days vs previous 30 days)
    recent_price = hist_data[-1]["price"]
    prev_price = hist_data[-2]["price"]
    trend_factor = 1.0 + ((recent_price - prev_price) / prev_price)
    trend_factor = max(0.8, min(1.2, trend_factor)) # caps at 20% swing
    
    # Layer 3 - Supply Glut
    glut_months = {
        "Wheat": [4, 5], "Onion": [10, 11], "Tomato": [8],
        "Cotton": [10, 11, 12], "Soybean": [10, 11], "Rice": [10, 11]
    }
    is_glut = harvest_month in glut_months.get(crop, [])
    glut_factor = random.uniform(0.85, 0.90) if is_glut else 1.0
    
    final_price = baseline * trend_factor * glut_factor
    
    confidence = random.randint(80, 95)
    risk_level = "HIGH" if final_price < recent_price * 0.9 else ("MEDIUM" if final_price < recent_price * 1.05 else "LOW")
    
    best_start = harvest_date - datetime.timedelta(days=random.randint(2, 5))
    best_end = harvest_date + datetime.timedelta(days=random.randint(5, 10))
    if is_glut:
        best_start = harvest_date - datetime.timedelta(days=random.randint(10, 15))
        best_end = harvest_date - datetime.timedelta(days=2)
        insight = f"{crop} prices drop {int((1-glut_factor)*100)}% in peak harvest month ({harvest_date.strftime('%B')}) due to supply glut in {district}. Ensure early sell!"
    elif final_price > recent_price:
        insight = f"Good news! {crop} prices are trending UP historically towards {harvest_date.strftime('%B')}. Plan for high margins."
    else:
        insight = f"Normal price fluctuations expected for {crop} in {district}. Safe to harvest around {harvest_date_str}."

    future_trend = []
    for i in range(30):
        progress = i / 29.0
        p = recent_price + (final_price - recent_price) * progress
        p += random.randint(-int(p * 0.02), int(p * 0.02))
        future_trend.append(round(p))

    # Math for total revenue
    yields = {"Wheat": 15, "Rice": 20, "Onion": 100, "Tomato": 150, "Cotton": 8, "Soybean": 8, "Maize": 20, "Sugarcane": 300}
    avg_yield = yields.get(crop, 15)
    total_rev = round(final_price * avg_yield * float(farm_size_acres))

    return {
        "predicted_price": round(final_price),
        "confidence": confidence,
        "best_sell_window": {
            "start": best_start.strftime("%Y-%m-%d"),
            "end": best_end.strftime("%Y-%m-%d")
        },
        "risk_level": risk_level,
        "price_trend": future_trend,
        "total_revenue_estimate": total_rev,
        "insight": insight
    }
