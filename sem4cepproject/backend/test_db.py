import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["medora"]
    
    inv_count = await db["inventory"].count_documents({})
    med_count = await db["medicines"].count_documents({})
    print(f"Inventory total: {inv_count}")
    print(f"Medicines total: {med_count}")
    
    cursor = db["inventory"].find({"pharmacy_id": {"$nin": ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]}})
    new_inv = await cursor.to_list(100)
    print(f"New pharmacist inventory count: {len(new_inv)}")
    for inv in new_inv:
        print("Inv:", inv)
        med_id = inv["medicine_id"]
        # Try both lookup methods
        med = await db["medicines"].find_one({"legacy_id": med_id})
        if not med and ObjectId.is_valid(med_id):
            med = await db["medicines"].find_one({"_id": ObjectId(med_id)})
        print("Found Med:", bool(med))
        if med:
            print("Med:", med)

asyncio.run(main())
