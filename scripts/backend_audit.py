import requests
import sqlite3
import os
import json

BASE_URL = "http://127.0.0.1:5000"
DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'smart_farm.db')

def ping_server():
    print("--- 1. Pinging Server ---")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 200:
            print("SERVER IS RUNNING [OK]\n")
        else:
            print("SERVER ISSUE [FAIL]\n")
    except requests.exceptions.ConnectionError:
        print("CONNECTION ERROR: Is the Flask server running? [FAIL]\n")

def test_analyze_farm():
    print("--- 2. Testing /analyze_farm ---")
    payload = {
        "farmer_id": 1,
        "lat": 19.0760,
        "lon": 72.8777
    }
    
    # We'll use a dummy image file.
    # The endpoint accepts multipart/form-data.
    files = {
        'image_file': ('dummy.jpg', b'dummy content', 'image/jpeg')
    }
    
    try:
        response = requests.post(f"{BASE_URL}/analyze_farm", data=payload, files=files)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Valid JSON Response Received [OK]")
            print("Response Snippet:")
            print(json.dumps(response.json(), indent=2)[:500] + "...\n")
        else:
            print("Failed to analyze farm [FAIL]\n")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print("CONNECTION ERROR [FAIL]\n")

def test_market_view():
    print("--- 3. Testing /api/market/view ---")
    try:
        response = requests.get(f"{BASE_URL}/api/market/view")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data.get("listings"), list):
                print(f"Returns a list. Count: {data.get('count')} [OK]\n")
            else:
                print("Does not return a list for listings [FAIL]\n")
        else:
            print("Failed to get market view [FAIL]\n")
    except requests.exceptions.ConnectionError:
        print("CONNECTION ERROR [FAIL]\n")

def test_db_verification():
    print("--- 4. DB Verification ---")
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. Ensure the path is correct. [FAIL]\n")
        return
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM analysis_history")
        count = cursor.fetchone()[0]
        print(f"Rows in analysis_history table: {count} [OK]\n")
        conn.close()
    except Exception as e:
        print(f"Database Error: {e} [FAIL]\n")

if __name__ == "__main__":
    ping_server()
    test_analyze_farm()
    test_market_view()
    test_db_verification()
