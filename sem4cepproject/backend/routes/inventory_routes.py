from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from typing import List
from datetime import datetime, timezone

from database import pharmacies_collection, inventory_collection, medicines_collection
from models import InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
from auth import get_current_user

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

def require_pharmacist(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "pharmacist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pharmacist privileges required."
        )
    return current_user

async def get_my_pharmacy_id(user_id: ObjectId) -> str:
    pharmacy = await pharmacies_collection.find_one({"owner_id": user_id})
    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pharmacy profile found for this user."
        )
    return pharmacy.get("legacy_id") or str(pharmacy["_id"])

@router.get("/my", response_model=List[InventoryItemResponse])
async def get_my_inventory(current_user: dict = Depends(require_pharmacist)):
    pharmacy_id = await get_my_pharmacy_id(current_user["_id"])
    
    cursor = inventory_collection.find({"pharmacy_id": pharmacy_id})
    inventory_items = await cursor.to_list(length=2000)
    
    results = []
    for item in inventory_items:
        med_id = item["medicine_id"]
        # Try finding medicine by legacy_id or _id
        med = await medicines_collection.find_one({"legacy_id": med_id})
        if not med and ObjectId.is_valid(med_id):
            med = await medicines_collection.find_one({"_id": ObjectId(med_id)})
            
        if med:
            results.append({
                "id": str(item["_id"]),
                "medicine_id": str(med_id),
                "name": med.get("name", "Unknown Medicine"),
                "type": med.get("type", "Tablet"),  # Defaulting old seeded data to Tablet
                "category": med.get("category", "Other"),
                "stock": item.get("stock", 0),
                "price": float(item.get("price", 0.0)),
                "expiryDate": item.get("expiryDate", ""),
                "rxRequired": med.get("rxRequired", False)
            })
    return results

@router.post("/my", response_model=InventoryItemResponse)
async def add_inventory_item(data: InventoryItemCreate, current_user: dict = Depends(require_pharmacist)):
    pharmacy_id = await get_my_pharmacy_id(current_user["_id"])
    
    # Need to check if a medicine with exact name exists, or create a new one.
    # To prevent duplication issues, we'll try to find an exact case-insensitive match.
    # In reality, exact string match might not be perfect, but works for the MVP.
    med = await medicines_collection.find_one({"name": {"$regex": f"^{data.name}$", "$options": "i"}})
    
    if not med:
        # Create global custom medicine
        med_doc = {
            "name": data.name,
            "type": data.type,
            "category": data.category,
            "rxRequired": data.rxRequired,
            "created_at": datetime.now(timezone.utc)
        }
        res = await medicines_collection.insert_one(med_doc)
        med_id = str(res.inserted_id)
        med = med_doc
        med["_id"] = res.inserted_id
    else:
        med_id = med.get("legacy_id") or str(med["_id"])

    # Create inventory mapping
    inv_doc = {
        "pharmacy_id": pharmacy_id,
        "medicine_id": med_id,
        "stock": data.stock,
        "price": data.price,
        "expiryDate": data.expiryDate,
        "created_at": datetime.now(timezone.utc)
    }
    inv_res = await inventory_collection.insert_one(inv_doc)
    
    return {
        "id": str(inv_res.inserted_id),
        "medicine_id": med_id,
        "name": med.get("name", data.name),
        "type": med.get("type", data.type),
        "category": med.get("category", data.category),
        "stock": data.stock,
        "price": data.price,
        "expiryDate": data.expiryDate,
        "rxRequired": med.get("rxRequired", data.rxRequired)
    }

@router.post("/my/batch", response_model=dict)
async def add_inventory_batch(items: List[InventoryItemCreate], current_user: dict = Depends(require_pharmacist)):
    pharmacy_id = await get_my_pharmacy_id(current_user["_id"])
    
    added_count = 0
    for data in items:
        # Check if medicine exists globally
        med = await medicines_collection.find_one({"name": {"$regex": f"^{data.name}$", "$options": "i"}})
        
        if not med:
            med_doc = {
                "name": data.name,
                "type": data.type,
                "category": data.category,
                "rxRequired": data.rxRequired,
                "created_at": datetime.now(timezone.utc)
            }
            res = await medicines_collection.insert_one(med_doc)
            med_id = str(res.inserted_id)
        else:
            med_id = med.get("legacy_id") or str(med["_id"])

        # Check if pharmacist already has this inventory item
        existing_inv = await inventory_collection.find_one({
            "pharmacy_id": pharmacy_id,
            "medicine_id": med_id
        })
        
        if existing_inv:
            # Update stock and expiry if it exists
            await inventory_collection.update_one(
                {"_id": existing_inv["_id"]},
                {"$set": {
                    "stock": existing_inv.get("stock", 0) + data.stock,
                    "price": data.price,
                    "expiryDate": data.expiryDate
                }}
            )
        else:
            # Create new mapping
            inv_doc = {
                "pharmacy_id": pharmacy_id,
                "medicine_id": med_id,
                "stock": data.stock,
                "price": data.price,
                "expiryDate": data.expiryDate,
                "created_at": datetime.now(timezone.utc)
            }
            await inventory_collection.insert_one(inv_doc)
            
        added_count += 1
        
    return {"message": f"Successfully processed {added_count} items"}

@router.put("/my/{inv_id}", response_model=InventoryItemResponse)
async def update_inventory_item(inv_id: str, data: InventoryItemUpdate, current_user: dict = Depends(require_pharmacist)):
    pharmacy_id = await get_my_pharmacy_id(current_user["_id"])
    
    if not ObjectId.is_valid(inv_id):
        raise HTTPException(status_code=400, detail="Invalid inventory ID")
        
    inv = await inventory_collection.find_one({"_id": ObjectId(inv_id), "pharmacy_id": pharmacy_id})
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
        
    # Update inventory
    await inventory_collection.update_one(
        {"_id": ObjectId(inv_id)},
        {"$set": {
            "stock": data.stock,
            "price": data.price,
            "expiryDate": data.expiryDate
        }}
    )
    
    # Update medicine
    med_id = inv["medicine_id"]
    med_query = {"legacy_id": med_id} if not ObjectId.is_valid(med_id) else {"$or": [{"legacy_id": med_id}, {"_id": ObjectId(med_id)}]}
    
    await medicines_collection.update_many(
        med_query,
        {"$set": {
            "name": data.name,
            "type": data.type,
            "category": data.category,
            "rxRequired": data.rxRequired
        }}
    )
    
    return {
        "id": inv_id,
        "medicine_id": med_id,
        "name": data.name,
        "type": data.type,
        "category": data.category,
        "stock": data.stock,
        "price": data.price,
        "expiryDate": data.expiryDate,
        "rxRequired": data.rxRequired
    }

@router.delete("/my/{inv_id}")
async def delete_inventory_item(inv_id: str, current_user: dict = Depends(require_pharmacist)):
    pharmacy_id = await get_my_pharmacy_id(current_user["_id"])
    
    if not ObjectId.is_valid(inv_id):
        raise HTTPException(status_code=400, detail="Invalid inventory ID")
        
    result = await inventory_collection.delete_one({"_id": ObjectId(inv_id), "pharmacy_id": pharmacy_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
        
    return {"message": "Deleted successfully"}
