import os
import sqlite3
# Resolve database path dynamically.
# Vercel serverless runtime filesystem is read-only, so we write to /tmp in production.
if os.getenv("VERCEL"):
    DB_PATH = "/tmp/travel_agency.db"
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "travel_agency.db")
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        preferences TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS itineraries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        destination TEXT NOT NULL,
        dates TEXT NOT NULL,
        total_cost REAL NOT NULL,
        itinerary_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    conn.commit()
    conn.close()
    print(f"Database initialized successfully at: {DB_PATH}")
