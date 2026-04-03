import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["medora"]
    
    # 1. Print one new pharmacy
    new_pharmacy = await db["pharmacies"].find_one({"legacy_id": {"$exists": False}})
    if not new_pharmacy:
        # Fallback if the user actually used a seeded pharmacy
        print("No NEW pharmacy found.")
        new_pharmacy = await db["pharmacies"].find_one({})
    
    print("\n--- PHARMACY ---")
    print(json.dumps(new_pharmacy, cls=JSONEncoder, indent=2, default=str))
    
    # 2. Find inventory for this pharmacy
    pharmacy_id = new_pharmacy.get("legacy_id") or str(new_pharmacy["_id"])
    
    cur = db["inventory"].find({"pharmacy_id": pharmacy_id})
    invs = await cur.to_list(100)
    
    print(f"\n--- INVENTORY ({len(invs)}) ---")
    for inv in invs:
        med_id = inv["medicine_id"]
        med = await db["medicines"].find_one({"legacy_id": med_id})
        if not med and ObjectId.is_valid(med_id):
            med = await db["medicines"].find_one({"_id": ObjectId(med_id)})
            
        print("INV:", json.dumps(inv, cls=JSONEncoder, indent=2, default=str))
        print("MED:", json.dumps(med, cls=JSONEncoder, indent=2, default=str))

asyncio.run(main())
