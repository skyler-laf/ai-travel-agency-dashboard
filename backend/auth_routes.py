import json
import hashlib
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from database import get_db_connection

router = APIRouter()

# ---------------------------------------------------------------------------
# Auth Request/Response Models
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    username: str
    password: str
    preferences: Optional[str] = ""

class UserLogin(BaseModel):
    username: str
    password: str

class ProfileUpdate(BaseModel):
    user_id: int
    preferences: str

class SaveItinerary(BaseModel):
    user_id: int
    destination: str
    dates: str
    total_cost: float
    itinerary_data: dict

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Standard secure hashing without external dependencies."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

# ---------------------------------------------------------------------------
# Authentication Endpoints
# ---------------------------------------------------------------------------

@router.post("/api/auth/register")
def register_user(user: UserRegister):
    username = user.username.strip()
    if not username or not user.password:
        raise HTTPException(status_code=400, detail="Username and password are required")
        
    password_hash = hash_password(user.password)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash, preferences) VALUES (?, ?, ?)",
            (username, password_hash, user.preferences)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return {
            "status": "success",
            "user": {
                "id": user_id,
                "username": username,
                "preferences": user.preferences
            }
        }
    except Exception as e:
        conn.rollback()
        # Handle SQLite unique constraint error
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="Username is already taken")
        raise HTTPException(status_code=500, detail=f"Database registration failure: {str(e)}")
    finally:
        conn.close()

@router.post("/api/auth/login")
def login_user(user: UserLogin):
    username = user.username.strip()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, username, password_hash, preferences FROM users WHERE username = ?",
        (username,)
    )
    db_user = cursor.fetchone()
    conn.close()
    
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    pwd_hash = hash_password(user.password)
    if db_user["password_hash"] != pwd_hash:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    return {
        "status": "success",
        "user": {
            "id": db_user["id"],
            "username": db_user["username"],
            "preferences": db_user["preferences"]
        }
    }

@router.put("/api/auth/profile")
def update_profile(profile: ProfileUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET preferences = ? WHERE id = ?",
            (profile.preferences, profile.user_id)
        )
        conn.commit()
        return {"status": "success", "preferences": profile.preferences}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Itinerary Storage & History Endpoints
# ---------------------------------------------------------------------------

@router.post("/api/itineraries")
def save_itinerary(itinerary: SaveItinerary):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        itinerary_json_str = json.dumps(itinerary.itinerary_data)
        cursor.execute(
            "INSERT INTO itineraries (user_id, destination, dates, total_cost, itinerary_json) VALUES (?, ?, ?, ?, ?)",
            (itinerary.user_id, itinerary.destination, itinerary.dates, itinerary.total_cost, itinerary_json_str)
        )
        conn.commit()
        itinerary_id = cursor.lastrowid
        return {"status": "success", "id": itinerary_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save itinerary: {str(e)}")
    finally:
        conn.close()

@router.get("/api/itineraries")
def get_itineraries(user_id: int = Query(..., description="The user ID to fetch history for")):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, destination, dates, total_cost, created_at FROM itineraries WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    itineraries = []
    for row in rows:
        itineraries.append({
            "id": row["id"],
            "destination": row["destination"],
            "dates": row["dates"],
            "total_cost": row["total_cost"],
            "created_at": row["created_at"]
        })
    return itineraries

@router.get("/api/itineraries/{itinerary_id}")
def get_single_itinerary(itinerary_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT itinerary_json FROM itineraries WHERE id = ?",
        (itinerary_id,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Itinerary not found")
        
    return json.loads(row["itinerary_json"])

@router.delete("/api/itineraries/{itinerary_id}")
def delete_itinerary(itinerary_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM itineraries WHERE id = ?", (itinerary_id,))
        conn.commit()
        return {"status": "success", "message": "Itinerary deleted"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
