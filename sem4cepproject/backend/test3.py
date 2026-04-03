import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["medora"]
    
    cur = db["inventory"].find({"pharmacy_id": {"$nin": ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]}})
    invs = await cur.to_list(100)
    for i in invs:
        print("Inventory ID:", i["_id"], "| Pharmacy ID:", i["pharmacy_id"])

asyncio.run(main())
