"""
MEDORA Backend — FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import db, users_collection
from auth import hash_password
from routes.auth_routes import router as auth_router
from routes.admin_routes import router as admin_router
from routes.inventory_routes import router as inventory_router
from routes.search_routes import router as search_router
from routes.booking_routes import router as booking_router
from datetime import datetime, timezone


async def seed_admin():
    """Create the default admin account if it doesn't exist."""
    existing = await users_collection.find_one({"email": "admin@medora.com"})
    if not existing:
        admin_doc = {
            "name": "Admin Medora",
            "email": "admin@medora.com",
            "password_hash": hash_password("admin123"),
            "role": "admin",
            "status": "active",
            "created_at": datetime.now(timezone.utc),
        }
        await users_collection.insert_one(admin_doc)
        print("[SUCCESS] Admin user seeded: admin@medora.com / admin123")
    else:
        print("[INFO] Admin user already exists.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    # Startup
    print("[STARTING] Connecting to MongoDB...")
    # Create unique index on email
    await users_collection.create_index("email", unique=True)
    # Seed admin
    await seed_admin()
    print("[READY] MEDORA Backend is ready!")
    yield
    # Shutdown
    print("[STOPPING] Shutting down...")


app = FastAPI(
    title="MEDORA API",
    description="Backend API for the MEDORA medicine locator platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(inventory_router)
app.include_router(search_router)
app.include_router(booking_router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "MEDORA API", "version": "1.0.0"}
