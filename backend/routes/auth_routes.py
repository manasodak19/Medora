"""
Auth API routes — signup, signin, me.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId

from database import users_collection, pharmacies_collection
from models import UserSignUp, UserSignIn, UserResponse, TokenResponse
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def user_doc_to_response(user: dict) -> UserResponse:
    """Convert a MongoDB user document to a UserResponse."""
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        status=user.get("status", "active"),
        created_at=user.get("created_at", "").isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", "")),
    )


# ── POST /api/auth/signup ────────────────────────────────────
@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: UserSignUp):
    # 1. Check for duplicate email
    existing = await users_collection.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # 2. Validate pharmacist fields
    if data.role == "pharmacist":
        missing = []
        if not data.pharmacy_name:
            missing.append("pharmacy_name")
        if not data.city:
            missing.append("city")
        if not data.phone:
            missing.append("phone")
        if not data.timings:
            missing.append("timings")
        if not data.license_number:
            missing.append("license_number")
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Pharmacist registration requires: {', '.join(missing)}",
            )

    # 3. Create user document
    user_doc = {
        "name": data.name.strip(),
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "role": data.role,
        "status": "pending" if data.role == "pharmacist" else "active",
        "created_at": datetime.now(timezone.utc),
    }
    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # 4. If pharmacist, create pharmacy document
    if data.role == "pharmacist":
        pharmacy_doc = {
            "owner_id": result.inserted_id,
            "name": data.pharmacy_name.strip(),
            "owner_name": data.name.strip(),
            "email": data.email.lower(),
            "phone": data.phone.strip(),
            "city": data.city.strip(),
            "address": f"{data.city.strip()}",
            "lat": data.lat or 0.0,
            "lng": data.lng or 0.0,
            "timings": data.timings.strip(),
            "license": data.license_number.strip(),
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
        }
        await pharmacies_collection.insert_one(pharmacy_doc)

    # 5. Generate JWT
    token = create_access_token({"sub": str(result.inserted_id), "role": data.role})
    user_response = user_doc_to_response(user_doc)

    return TokenResponse(access_token=token, user=user_response)


# ── POST /api/auth/signin ────────────────────────────────────
@router.post("/signin", response_model=TokenResponse)
async def signin(data: UserSignIn):
    # 1. Find user
    user = await users_collection.find_one({"email": data.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 2. Verify password
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 3. Check if banned or pending
    if user.get("status") == "banned":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned. Contact support.",
        )
    if user.get("status") == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin verification.",
        )

    # 4. Generate JWT
    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    user_response = user_doc_to_response(user)

    return TokenResponse(access_token=token, user=user_response)


# ── GET /api/auth/me ──────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return user_doc_to_response(current_user)
