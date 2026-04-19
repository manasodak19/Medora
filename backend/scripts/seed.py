"""
Database seeder — populates MongoDB with initial data matching the frontend dummy data.
Run: python seed.py
"""
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "medora")

# ── Seed Data (matches src/data/data.js) ──────────────────────

CATEGORIES = [
    "Antibiotics", "Pain Relief", "First Aid", "Vitamins & Supplements",
    "Skin Care", "Digestive Health", "Cold & Flu", "Diabetes Care",
    "Heart Health", "Eye & Ear Care",
]

PHARMACIES = [
    {
        "id": "p1", "name": "MedPlus Pharmacy", "owner_name": "Rajesh Kumar",
        "email": "medplus@pharmacy.com", "phone": "+91 98201 12345",
        "city": "Mumbai", "address": "Shop 4, Andheri West, Mumbai 400058",
        "lat": 19.1364, "lng": 72.8296, "timings": "8:00 AM – 10:00 PM",
        "license": "MH-PH-2024-00142", "status": "verified",
    },
    {
        "id": "p2", "name": "Apollo Pharmacy", "owner_name": "Sunita Nair",
        "email": "apollo@pharmacy.com", "phone": "+91 98201 22345",
        "city": "Mumbai", "address": "12, Bandra Linking Road, Mumbai 400050",
        "lat": 19.0596, "lng": 72.8295, "timings": "24 Hours",
        "license": "MH-PH-2024-00208", "status": "verified",
    },
    {
        "id": "p3", "name": "Wellness Forever", "owner_name": "Amit Shah",
        "email": "wellness@pharmacy.com", "phone": "+91 98201 33345",
        "city": "Mumbai", "address": "7A, Powai Plaza, Mumbai 400076",
        "lat": 19.1176, "lng": 72.9060, "timings": "9:00 AM – 11:00 PM",
        "license": "MH-PH-2024-00315", "status": "verified",
    },
    {
        "id": "p4", "name": "HealthKart Store", "owner_name": "Deepak Verma",
        "email": "healthkart@pharmacy.com", "phone": "+91 98201 44345",
        "city": "Mumbai", "address": "25, Dadar TT Circle, Mumbai 400014",
        "lat": 19.0186, "lng": 72.8425, "timings": "8:30 AM – 9:30 PM",
        "license": "MH-PH-2024-00421", "status": "pending",
    },
    {
        "id": "p5", "name": "Netmeds Pharmacy", "owner_name": "Kavitha Rao",
        "email": "netmeds@pharmacy.com", "phone": "+91 98201 55345",
        "city": "Mumbai", "address": "3, Colaba Causeway, Mumbai 400005",
        "lat": 18.9067, "lng": 72.8147, "timings": "9:00 AM – 9:00 PM",
        "license": "MH-PH-2024-00537", "status": "verified",
    },
    {
        "id": "p6", "name": "PharmEasy Hub", "owner_name": "Nilesh Patil",
        "email": "pharmeasy@pharmacy.com", "phone": "+91 98201 66345",
        "city": "Mumbai", "address": "18, Borivali East, Mumbai 400066",
        "lat": 19.2307, "lng": 72.8567, "timings": "8:00 AM – 10:00 PM",
        "license": "MH-PH-2024-00689", "status": "pending",
    },
    {
        "id": "p7", "name": "Guardian Pharmacy", "owner_name": "Rashmi Kulkarni",
        "email": "guardian@pharmacy.com", "phone": "+91 98201 77345",
        "city": "Mumbai", "address": "9, Juhu Tara Road, Mumbai 400049",
        "lat": 19.0883, "lng": 72.8263, "timings": "7:00 AM – 11:00 PM",
        "license": "MH-PH-2024-00756", "status": "verified",
    },
    {
        "id": "p8", "name": "CareFirst Medical", "owner_name": "Suresh Menon",
        "email": "carefirst@pharmacy.com", "phone": "+91 98201 88345",
        "city": "Mumbai", "address": "31, Malad West, Mumbai 400064",
        "lat": 19.1872, "lng": 72.8484, "timings": "9:00 AM – 10:00 PM",
        "license": "MH-PH-2024-00834", "status": "denied",
    },
]

MEDICINES = [
    {"id": "m1",  "name": "Amoxicillin 500mg",      "category": "Antibiotics",             "price": 120, "rxRequired": True},
    {"id": "m2",  "name": "Azithromycin 250mg",      "category": "Antibiotics",             "price": 95,  "rxRequired": True},
    {"id": "m3",  "name": "Paracetamol 500mg",       "category": "Pain Relief",             "price": 30,  "rxRequired": False},
    {"id": "m4",  "name": "Ibuprofen 400mg",         "category": "Pain Relief",             "price": 45,  "rxRequired": False},
    {"id": "m5",  "name": "Diclofenac Gel",          "category": "Pain Relief",             "price": 85,  "rxRequired": False},
    {"id": "m6",  "name": "Band-Aid Strips (50)",    "category": "First Aid",               "price": 150, "rxRequired": False},
    {"id": "m7",  "name": "Dettol Antiseptic 100ml", "category": "First Aid",               "price": 75,  "rxRequired": False},
    {"id": "m8",  "name": "Betadine Ointment",       "category": "First Aid",               "price": 65,  "rxRequired": False},
    {"id": "m9",  "name": "Vitamin C 1000mg",        "category": "Vitamins & Supplements",  "price": 250, "rxRequired": False},
    {"id": "m10", "name": "Vitamin D3 60K IU",       "category": "Vitamins & Supplements",  "price": 130, "rxRequired": False},
    {"id": "m11", "name": "Multivitamin Tablets",    "category": "Vitamins & Supplements",  "price": 320, "rxRequired": False},
    {"id": "m12", "name": "Cetaphil Moisturizer",    "category": "Skin Care",               "price": 450, "rxRequired": False},
    {"id": "m13", "name": "Clindamycin Gel",         "category": "Skin Care",               "price": 180, "rxRequired": True},
    {"id": "m14", "name": "Pantoprazole 40mg",       "category": "Digestive Health",        "price": 70,  "rxRequired": True},
    {"id": "m15", "name": "Domperidone 10mg",        "category": "Digestive Health",        "price": 55,  "rxRequired": True},
    {"id": "m16", "name": "ORS Sachets (10)",        "category": "Digestive Health",        "price": 40,  "rxRequired": False},
    {"id": "m17", "name": "Cetirizine 10mg",         "category": "Cold & Flu",              "price": 25,  "rxRequired": False},
    {"id": "m18", "name": "Vicks VapoRub 50ml",      "category": "Cold & Flu",              "price": 110, "rxRequired": False},
    {"id": "m19", "name": "Metformin 500mg",         "category": "Diabetes Care",           "price": 60,  "rxRequired": True},
    {"id": "m20", "name": "Atorvastatin 10mg",       "category": "Heart Health",            "price": 90,  "rxRequired": True},
    {"id": "m21", "name": "Ciprofloxacin Eye Drops", "category": "Eye & Ear Care",          "price": 70,  "rxRequired": True},
    {"id": "m22", "name": "Crocin Advance 500mg",    "category": "Pain Relief",             "price": 35,  "rxRequired": False},
]

INVENTORY = {
    "p1": {
        "m1":  {"stock": 25,  "expiryDate": "2027-03-15"},
        "m3":  {"stock": 120, "expiryDate": "2027-08-20"},
        "m4":  {"stock": 8,   "expiryDate": "2027-01-10"},
        "m6":  {"stock": 45,  "expiryDate": "2028-12-01"},
        "m9":  {"stock": 0,   "expiryDate": "2026-11-30"},
        "m14": {"stock": 30,  "expiryDate": "2027-06-15"},
        "m17": {"stock": 60,  "expiryDate": "2027-09-01"},
        "m19": {"stock": 3,   "expiryDate": "2027-04-20"},
        "m22": {"stock": 80,  "expiryDate": "2027-12-15"},
    },
    "p2": {
        "m1":  {"stock": 50,  "expiryDate": "2027-05-20"},
        "m2":  {"stock": 15,  "expiryDate": "2027-02-28"},
        "m3":  {"stock": 200, "expiryDate": "2028-01-15"},
        "m5":  {"stock": 0,   "expiryDate": "2026-09-10"},
        "m7":  {"stock": 35,  "expiryDate": "2028-06-01"},
        "m10": {"stock": 22,  "expiryDate": "2027-11-15"},
        "m12": {"stock": 5,   "expiryDate": "2027-07-20"},
        "m15": {"stock": 40,  "expiryDate": "2027-03-30"},
        "m18": {"stock": 18,  "expiryDate": "2028-02-28"},
        "m20": {"stock": 12,  "expiryDate": "2027-08-15"},
    },
    "p3": {
        "m2":  {"stock": 0,   "expiryDate": "2026-12-01"},
        "m3":  {"stock": 90,  "expiryDate": "2027-10-20"},
        "m8":  {"stock": 7,   "expiryDate": "2027-04-15"},
        "m11": {"stock": 28,  "expiryDate": "2027-09-30"},
        "m13": {"stock": 2,   "expiryDate": "2027-01-25"},
        "m16": {"stock": 55,  "expiryDate": "2028-03-10"},
        "m21": {"stock": 14,  "expiryDate": "2027-06-01"},
        "m22": {"stock": 0,   "expiryDate": "2026-08-15"},
    },
    "p4": {
        "m1":  {"stock": 10,  "expiryDate": "2027-07-10"},
        "m3":  {"stock": 150, "expiryDate": "2028-02-15"},
        "m4":  {"stock": 0,   "expiryDate": "2026-10-20"},
        "m9":  {"stock": 20,  "expiryDate": "2027-12-01"},
        "m14": {"stock": 6,   "expiryDate": "2027-03-20"},
        "m17": {"stock": 45,  "expiryDate": "2027-11-10"},
        "m19": {"stock": 30,  "expiryDate": "2027-08-25"},
    },
    "p5": {
        "m2":  {"stock": 18,  "expiryDate": "2027-04-30"},
        "m5":  {"stock": 12,  "expiryDate": "2027-09-15"},
        "m7":  {"stock": 0,   "expiryDate": "2026-07-20"},
        "m10": {"stock": 35,  "expiryDate": "2028-01-10"},
        "m12": {"stock": 8,   "expiryDate": "2027-06-20"},
        "m15": {"stock": 25,  "expiryDate": "2027-05-15"},
        "m18": {"stock": 40,  "expiryDate": "2028-04-01"},
        "m20": {"stock": 3,   "expiryDate": "2027-02-28"},
        "m21": {"stock": 16,  "expiryDate": "2027-10-10"},
    },
    "p6": {
        "m1":  {"stock": 40,  "expiryDate": "2027-08-01"},
        "m3":  {"stock": 75,  "expiryDate": "2027-12-20"},
        "m6":  {"stock": 0,   "expiryDate": "2026-11-15"},
        "m8":  {"stock": 20,  "expiryDate": "2027-05-10"},
        "m11": {"stock": 9,   "expiryDate": "2027-07-30"},
        "m13": {"stock": 15,  "expiryDate": "2027-09-20"},
        "m16": {"stock": 30,  "expiryDate": "2028-01-25"},
    },
    "p7": {
        "m1":  {"stock": 5,   "expiryDate": "2027-02-15"},
        "m2":  {"stock": 22,  "expiryDate": "2027-06-10"},
        "m3":  {"stock": 180, "expiryDate": "2028-03-01"},
        "m4":  {"stock": 35,  "expiryDate": "2027-10-15"},
        "m9":  {"stock": 15,  "expiryDate": "2027-11-20"},
        "m17": {"stock": 50,  "expiryDate": "2027-08-30"},
        "m19": {"stock": 0,   "expiryDate": "2026-09-25"},
        "m22": {"stock": 65,  "expiryDate": "2027-12-10"},
    },
    "p8": {
        "m3":  {"stock": 60,  "expiryDate": "2027-09-15"},
        "m5":  {"stock": 4,   "expiryDate": "2027-03-10"},
        "m10": {"stock": 18,  "expiryDate": "2027-07-25"},
        "m14": {"stock": 0,   "expiryDate": "2026-12-20"},
        "m16": {"stock": 42,  "expiryDate": "2028-02-10"},
        "m20": {"stock": 7,   "expiryDate": "2027-05-30"},
        "m21": {"stock": 11,  "expiryDate": "2027-04-05"},
    },
}

# Password for seeded pharmacist users
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    users_col = db["users"]
    pharmacies_col = db["pharmacies"]
    medicines_col = db["medicines"]
    inventory_col = db["inventory"]

    # ── 1. Seed Admin ────────────────────────────────────────
    existing_admin = await users_col.find_one({"email": "admin@medora.com"})
    if not existing_admin:
        await users_col.insert_one({
            "name": "Admin Medora",
            "email": "admin@medora.com",
            "password_hash": pwd_context.hash("admin123"),
            "role": "admin",
            "status": "active",
            "created_at": datetime.now(timezone.utc),
        })
        print("✅ Admin user created")
    else:
        print("ℹ️  Admin already exists")

    # ── 2. Seed Pharmacist Users + Pharmacies ────────────────
    for p in PHARMACIES:
        existing_pharmacy = await pharmacies_col.find_one({"legacy_id": p["id"]})
        if existing_pharmacy:
            print(f"ℹ️  Pharmacy {p['name']} already exists")
            continue

        # Create a pharmacist user account
        pharmacist_email = p["email"]
        existing_user = await users_col.find_one({"email": pharmacist_email})
        if not existing_user:
            user_result = await users_col.insert_one({
                "name": p["owner_name"],
                "email": pharmacist_email,
                "password_hash": pwd_context.hash("pharma123"),
                "role": "pharmacist",
                "status": "active",
                "created_at": datetime.now(timezone.utc),
            })
            owner_id = user_result.inserted_id
        else:
            owner_id = existing_user["_id"]

        await pharmacies_col.insert_one({
            "legacy_id": p["id"],
            "owner_id": owner_id,
            "name": p["name"],
            "owner_name": p["owner_name"],
            "email": p["email"],
            "phone": p["phone"],
            "city": p["city"],
            "address": p["address"],
            "lat": p["lat"],
            "lng": p["lng"],
            "timings": p["timings"],
            "license": p["license"],
            "status": p["status"],
            "created_at": datetime.now(timezone.utc),
        })
        print(f"✅ Pharmacy {p['name']} created")

    # ── 3. Seed Medicines ────────────────────────────────────
    existing_meds = await medicines_col.count_documents({})
    if existing_meds == 0:
        for med in MEDICINES:
            await medicines_col.insert_one({
                "legacy_id": med["id"],
                "name": med["name"],
                "category": med["category"],
                "price": med["price"],
                "rxRequired": med["rxRequired"],
                "created_at": datetime.now(timezone.utc),
            })
        print(f"✅ {len(MEDICINES)} medicines seeded")
    else:
        print(f"ℹ️  Medicines already exist ({existing_meds} found)")

    # ── 4. Seed Inventory ────────────────────────────────────
    existing_inv = await inventory_col.count_documents({})
    if existing_inv == 0:
        for pharmacy_id, meds in INVENTORY.items():
            for med_id, info in meds.items():
                await inventory_col.insert_one({
                    "pharmacy_id": pharmacy_id,
                    "medicine_id": med_id,
                    "stock": info["stock"],
                    "expiryDate": info["expiryDate"],
                    "created_at": datetime.now(timezone.utc),
                })
        total = sum(len(m) for m in INVENTORY.values())
        print(f"✅ {total} inventory records seeded")
    else:
        print(f"ℹ️  Inventory already exists ({existing_inv} found)")

    # ── 5. Create indexes ────────────────────────────────────
    await users_col.create_index("email", unique=True)
    await pharmacies_col.create_index("legacy_id")
    await medicines_col.create_index("legacy_id")
    await inventory_col.create_index([("pharmacy_id", 1), ("medicine_id", 1)])

    print("\n🎉 Seeding complete!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
