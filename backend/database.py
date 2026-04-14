"""
MongoDB async connection using Motor.
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "medora")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# ── Collection accessors ──────────────────────────────────────
users_collection = db["users"]
pharmacies_collection = db["pharmacies"]
medicines_collection = db["medicines"]
inventory_collection = db["inventory"]
