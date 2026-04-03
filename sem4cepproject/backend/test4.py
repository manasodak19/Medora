import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["medora"]
    
    pharmacy_id = "69cd3b56556eacb22df48cb9"
    cursor = db["inventory"].find({"pharmacy_id": pharmacy_id})
    inventory_items = await cursor.to_list(length=2000)
    
    results = []
    for item in inventory_items:
        med_id = item["medicine_id"]
        med = await db["medicines"].find_one({"legacy_id": med_id})
        if not med and ObjectId.is_valid(med_id):
            med = await db["medicines"].find_one({"_id": ObjectId(med_id)})
            
        print("M", bool(med), med_id)
        if med:
            results.append({
                "id": str(item["_id"]),
                "medicine_id": str(med_id),
                "name": med.get("name", "Unknown Medicine"),
                "type": med.get("type", "Tablet"),  
                "category": med.get("category", "Other"),
                "stock": item.get("stock", 0),
                "expiryDate": item.get("expiryDate", ""),
                "rxRequired": med.get("rxRequired", False)
            })
    print("RESULTS:")
    print(results)

asyncio.run(main())
