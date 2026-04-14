"""
Pydantic models for request / response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ── Auth Requests ─────────────────────────────────────────────

class UserSignUp(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="user", pattern="^(user|pharmacist)$")

    # Pharmacist-only fields (required when role == pharmacist)
    pharmacy_name: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    timings: Optional[str] = None
    license_number: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class UserSignIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


# ── Auth Responses ────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str = "active"
    created_at: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Admin Models ──────────────────────────────────────────────

class AdminStats(BaseModel):
    totalUsers: int
    totalPharmacies: int
    totalStocks: int
    pendingVerifications: int


class PharmacyStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(verified|pending|denied|banned)$")


class PharmacyResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    owner_name: str
    email: str
    phone: str
    city: str
    address: str
    lat: float
    lng: float
    timings: str
    license: str
    status: str
    created_at: Optional[str] = None


# ── Inventory Models ──────────────────────────────────────────

class InventoryItemCreate(BaseModel):
    name: str = Field(..., min_length=1)
    type: str = "Tablet"
    category: str
    stock: int
    price: float = 0.0
    expiryDate: str
    rxRequired: bool = False

class InventoryItemUpdate(BaseModel):
    name: str
    type: str = "Tablet"
    category: str
    stock: int
    price: float = 0.0
    expiryDate: str
    rxRequired: bool

class InventoryItemResponse(BaseModel):
    id: str
    medicine_id: str
    name: str
    type: str
    category: str
    stock: int
    price: float
    expiryDate: str
    rxRequired: bool

# ── Booking Models ──────────────────────────────────────────

class BookingItem(BaseModel):
    medicine_id: str
    quantity: int

class BookingCreate(BaseModel):
    pharmacy_id: str
    items: list[BookingItem]

class BookingResponse(BaseModel):
    id: str
    user_id: str
    pharmacy_id: str
    items: list[dict]
    status: str
    qr_token: str
    expires_at: str
    created_at: str

class VerifyBookingRequest(BaseModel):
    qr_token: str
