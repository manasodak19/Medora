import math
from typing import List, Optional
from fastapi import APIRouter, Query
from bson import ObjectId

from database import medicines_collection, inventory_collection, pharmacies_collection

router = APIRouter(prefix="/api/search", tags=["Search"])

def haversine(lat1, lon1, lat2, lon2):
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return round(distance, 1)

@router.get("/")
async def search_inventory(
    q: str = Query("", description="Search query for medicine name"),
    category: str = Query("All", description="Medicine category"),
    lat: Optional[float] = Query(None, description="User latitude"),
    lng: Optional[float] = Query(None, description="User longitude")
):
    # 1. Find matching medicines
    med_query = {}
    if q.strip():
        med_query["name"] = {"$regex": q, "$options": "i"}
    if category != "All":
        med_query["category"] = category
        
    cursor = medicines_collection.find(med_query)
    matched_meds = await cursor.to_list(length=1000)
    
    if not matched_meds:
        return []
        
    med_lookup = {}
    med_id_list = []
    for m in matched_meds:
        m_id = str(m["_id"])
        legacy_id = m.get("legacy_id")
        
        med_lookup[m_id] = m
        med_id_list.append(m_id)
        if legacy_id:
            med_lookup[legacy_id] = m
            med_id_list.append(legacy_id)
            
    # 2. Find inventory stocking these medicines
    inv_cursor = inventory_collection.find({"medicine_id": {"$in": med_id_list}})
    inventory_items = await inv_cursor.to_list(length=5000)
    
    if not inventory_items:
        return []
        
    # Group inventory by pharmacy
    pharma_inv_map = {}
    for inv in inventory_items:
        pid = inv["pharmacy_id"]
        if pid not in pharma_inv_map:
            pharma_inv_map[pid] = []
        pharma_inv_map[pid].append(inv)
        
    # 3. Find verified pharmacies
    pharmacy_ids = list(pharma_inv_map.keys())
    p_query = {
        "status": "verified",
        "$or": [
            {"legacy_id": {"$in": pharmacy_ids}}
        ]
    }
    
    obj_ids = []
    for pid in pharmacy_ids:
        if ObjectId.is_valid(pid):
            obj_ids.append(ObjectId(pid))
            
    if obj_ids:
        p_query["$or"].append({"_id": {"$in": obj_ids}})
        
    p_cursor = pharmacies_collection.find(p_query)
    verified_pharmacies = await p_cursor.to_list(length=1000)
    
    # 4. Construct response
    results = []
    for p in verified_pharmacies:
        pid = p.get("legacy_id") or str(p["_id"])
        
        dist = None
        if lat is not None and lng is not None and p.get("lat") is not None and p.get("lng") is not None:
            try:
                dist = haversine(lat, lng, float(p["lat"]), float(p["lng"]))
            except Exception:
                pass
            
        pharma_data = {
            "id": pid,
            "name": p.get("name"),
            "address": p.get("address"),
            "city": p.get("city"),
            "lat": float(p.get("lat")) if p.get("lat") else 0,
            "lng": float(p.get("lng")) if p.get("lng") else 0,
            "phone": p.get("phone"),
            "timings": p.get("timings", "9AM - 10PM"), 
            "distance": dist
        }
        
        items = []
        for inv in pharma_inv_map.get(pid, []):
            med = med_lookup.get(inv["medicine_id"])
            if med:
                items.append({
                    "medicine": {
                        "id": str(med["_id"]),
                        "name": med.get("name"),
                        "type": med.get("type", "Tablet"),
                        "rxRequired": med.get("rxRequired", False)
                    },
                    "stock": inv.get("stock", 0),
                    "price": float(inv.get("price", med.get("price", 0.0))),
                    "expiryDate": inv.get("expiryDate")
                })
                
        if items:
            items.sort(key=lambda x: x["stock"], reverse=True)
            results.append({
                "pharmacy": pharma_data,
                "allMedicines": items
            })
            
    if lat is not None and lng is not None:
        results.sort(key=lambda x: x["pharmacy"]["distance"] if x["pharmacy"]["distance"] is not None else 99999)
        
    return results
