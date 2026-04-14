from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import uuid

from database import pharmacies_collection, inventory_collection
# Hack to get the client's db since database.py doesn't export 'db' clearly
from database import users_collection 

db = users_collection.database
bookings_collection = db["bookings"]

from models import BookingCreate, BookingResponse, VerifyBookingRequest
from auth import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(data: BookingCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    
    # Check if pharmacy exists
    p_query = {"$or": [{"legacy_id": data.pharmacy_id}]}
    if ObjectId.is_valid(data.pharmacy_id):
        p_query["$or"].append({"_id": ObjectId(data.pharmacy_id)})
        
    pharmacy = await pharmacies_collection.find_one(p_query)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
        
    actual_pid = pharmacy.get("legacy_id") or str(pharmacy["_id"])
    
    booking_items = []
    # Verify stock for all items
    for item in data.items:
        inv = await inventory_collection.find_one({
            "pharmacy_id": actual_pid,
            "medicine_id": item.medicine_id
        })
        if not inv or inv.get("stock", 0) < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for medicine ID {item.medicine_id}")
        
        booking_items.append({
            "medicine_id": item.medicine_id,
            "quantity": item.quantity,
            "price": inv.get("price", 0.0)
        })
        
    # Generate QR Token
    qr_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    booking_doc = {
        "user_id": user_id,
        "pharmacy_id": actual_pid,
        "items": booking_items,
        "status": "pending",
        "qr_token": qr_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    
    res = await bookings_collection.insert_one(booking_doc)
    
    return {
        "id": str(res.inserted_id),
        "user_id": str(user_id),
        "pharmacy_id": actual_pid,
        "items": booking_items,
        "status": "pending",
        "qr_token": qr_token,
        "expires_at": expires_at.isoformat(),
        "created_at": booking_doc["created_at"].isoformat()
    }

@router.post("/verify")
async def verify_booking(data: VerifyBookingRequest, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "pharmacist":
        raise HTTPException(status_code=403, detail="Pharmacist privileges required")
        
    # Must get pharmacist's pharmacy_id
    pharmacy = await pharmacies_collection.find_one({"owner_id": current_user["_id"]})
    if not pharmacy:
        raise HTTPException(status_code=404, detail="No pharmacy associated with your account")
        
    pid = pharmacy.get("legacy_id") or str(pharmacy["_id"])
    
    booking = await bookings_collection.find_one({
        "qr_token": {"$regex": f"^{data.qr_token}"}, 
        "pharmacy_id": pid
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Invalid booking code or code belongs to different pharmacy")
        
    # Ensure timezone awareness
    expires_at = booking["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expires_at and booking["status"] == "pending":
        await bookings_collection.update_one({"_id": booking["_id"]}, {"$set": {"status": "expired"}})
        raise HTTPException(status_code=400, detail="Booking code has expired")
        
    from database import medicines_collection, users_collection
    
    # Pre-fetch user and items regardless of status
    user = await users_collection.find_one({"_id": ObjectId(booking["user_id"])})
    customer_name = user.get("name", "Unknown Customer") if user else "Unknown Customer"
    
    verified_items = []
    for item in booking["items"]:
        med_query = {"$or": [{"legacy_id": item["medicine_id"]}]}
        if ObjectId.is_valid(item["medicine_id"]):
            med_query["$or"].append({"_id": ObjectId(item["medicine_id"])})
            
        med = await medicines_collection.find_one(med_query)
        med_name = med.get("name", "Unknown Medicine") if med else "Unknown Medicine"
        
        verified_items.append({
            "name": med_name,
            "quantity": item["quantity"]
        })

    if booking["status"] != "pending":
        return {
            "message": f"Notice: Booking is ALREADY {booking['status'].upper()}.",
            "already_confirmed": True,
            "customer_name": customer_name,
            "items": verified_items
        }

    # Deduct inventory only if it's pending
    for item in booking["items"]:
        await inventory_collection.update_one(
            {"pharmacy_id": pid, "medicine_id": item["medicine_id"]},
            {"$inc": {"stock": -item["quantity"]}}
        )
        
    await bookings_collection.update_one({"_id": booking["_id"]}, {"$set": {"status": "confirmed"}})
    
    return {
        "message": "Booking verified and inventory updated successfully!",
        "already_confirmed": False,
        "customer_name": customer_name,
        "items": verified_items
    }
