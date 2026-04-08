import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'smart_farm.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This allows accessing columns by name
    return conn

def init_db():
    """Initializes the SQLite database with required tables and indexes."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create farmers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS farmers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            language_pref TEXT DEFAULT 'English'
        )
    ''')

    # Create users table (with password hashes for real authentication)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            farm_size TEXT,
            primary_crop TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create marketplace table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS marketplace (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id INTEGER NOT NULL,
            crop_name TEXT NOT NULL,
            expected_yield_kg REAL,
            price_per_kg REAL,
            harvest_date TEXT,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (farmer_id) REFERENCES farmers (id)
        )
    ''')

    # Create analysis_history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id INTEGER NOT NULL,
            lat REAL,
            lon REAL,
            ndvi_score REAL,
            risk_level TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (farmer_id) REFERENCES farmers (id)
        )
    ''')

    # Create farm_locations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS farm_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id INTEGER,
            farm_name TEXT,
            state TEXT,
            district TEXT,
            soil_type TEXT,
            season TEXT,
            irrigation TEXT,
            area_acres REAL,
            area_hectares REAL,
            coordinates TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create predictions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id INTEGER,
            crop TEXT,
            district TEXT,
            harvest_date TEXT,
            farm_size_acres REAL,
            predicted_price REAL,
            confidence REAL,
            total_revenue_estimate REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ── Indexes for performance (Audit Fix 2.1) ──
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_analysis_history_farmer_id
        ON analysis_history(farmer_id)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_farm_locations_farmer_id
        ON farm_locations(farmer_id)
    ''')

    conn.commit()
    conn.close()
    print("Database initialized with sqlite3.")


# ────────────────────────────────────────────────
#  Auth helpers (Audit Fix 1.2)
# ────────────────────────────────────────────────

def create_user(name, phone, password_hash, farm_size=None, primary_crop=None):
    """Inserts a new user record. Returns user id, or None if phone already exists."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO users (name, phone, password_hash, farm_size, primary_crop)
               VALUES (?, ?, ?, ?, ?)""",
            (name, phone, password_hash, farm_size, primary_crop)
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_phone(phone):
    """Retrieves a user record by phone number. Returns dict or None."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


# ────────────────────────────────────────────────
#  Existing helpers
# ────────────────────────────────────────────────

def insert_farmer(name, phone, language_pref='English'):
    """Inserts a new farmer record."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO farmers (name, phone, language_pref) VALUES (?, ?, ?)",
            (name, phone, language_pref)
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        print(f"Error: Phone number {phone} already exists.")
        return None
    finally:
        conn.close()

def add_market_listing(farmer_id, crop_name, expected_yield_kg, price_per_kg, harvest_date):
    """Adds a new listing to the marketplace."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO marketplace (farmer_id, crop_name, expected_yield_kg, price_per_kg, harvest_date) VALUES (?, ?, ?, ?, ?)",
        (farmer_id, crop_name, expected_yield_kg, price_per_kg, harvest_date)
    )
    conn.commit()
    listing_id = cursor.lastrowid
    conn.close()
    return listing_id

def add_analysis_record(farmer_id, lat, lon, ndvi_score, risk_level):
    """Saves an analysis result to history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO analysis_history (farmer_id, lat, lon, ndvi_score, risk_level) VALUES (?, ?, ?, ?, ?)",
        (farmer_id, lat, lon, ndvi_score, risk_level)
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return record_id

def get_all_market_listings():
    """Retrieves all active marketplace listings."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM marketplace WHERE status = 'active'")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_farm_location(farmer_id, farm_name, state, district, soil_type, season, irrigation, area_acres, area_hectares, coordinates):
    """Saves a new farm location."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO farm_locations
           (farmer_id, farm_name, state, district, soil_type, season, irrigation,
            area_acres, area_hectares, coordinates)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (farmer_id, farm_name, state, district, soil_type, season, irrigation,
         area_acres, area_hectares, coordinates)
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return record_id

def get_all_farm_locations(farmer_id=None):
    """Retrieves farm locations. Filtering by farmer_id is optional."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if farmer_id:
        cursor.execute("SELECT * FROM farm_locations WHERE farmer_id = ?", (farmer_id,))
    else:
        cursor.execute("SELECT * FROM farm_locations")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_prediction(farmer_id, crop, district, harvest_date, farm_size_acres, predicted_price, confidence, total_revenue_estimate):
    """Saves a harvest prediction to history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO predictions
           (farmer_id, crop, district, harvest_date, farm_size_acres, predicted_price, confidence, total_revenue_estimate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (farmer_id, crop, district, harvest_date, farm_size_acres, predicted_price, confidence, total_revenue_estimate)
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return record_id

def get_predictions(farmer_id=None):
    """Retrieves saved predictions. Filtering by farmer_id is optional."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if farmer_id:
        cursor.execute("SELECT * FROM predictions WHERE farmer_id = ? ORDER BY created_at DESC", (farmer_id,))
    else:
        cursor.execute("SELECT * FROM predictions ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

if __name__ == "__main__":
    init_db()
