# 🏥 Medora: Localized Medicine Locator & Inventory Tracker

**Medora** is a state-of-the-art healthcare solution designed to bridge the gap between patients and pharmacies. It empowers users to find life-saving medications in real-time while providing pharmacists with a premium dashboard to manage their digital store.

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/492d9378-37b0-4af0-8a26-ffe570b36955" />

---

## ✨ Key Features

### 🔍 For Patients
- **Smart Search:** Find medicines by name with instant availability status.
- **Geospatial Discovery:** Automatically locates pharmacies within your preferred radius using the **Haversine formula**.
- **Interactive Maps:** Visualized pharmacy locations with distance calculations.
- **Dynamic Routing:** One-click directions to the nearest pharmacy via Google Maps integration.
- **QR Booking System:** Generate secure QR tokens to "reserve" medicines at a pharmacy for quick pickup.

### 🛡️ For Pharmacists & Admins
- **Modern Admin Dashboard:** Real-time inventory tracking with stock level alerts.
- **Pharmacy Management:** Complete control over pharmacy details, location, and operating status.
- **Secure Authentication:** JWT-based login with Bcrypt password hashing for ironclad security.
- **Analytics at a Glance:** Monitor system statistics and inventory health through an intuitive interface.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js 19 (Vite)
- **Styling:** Vanilla CSS (Modern Design System)
- **Navigation:** React Router DOM
- **Maps:** Leaflet & React-Leaflet
- **Icons:** Lucide-React

### Backend
- **Framework:** FastAPI (High-performance Python)
- **Database:** MongoDB (Atlas/Local)
- **Driver:** Motor (Asynchronous MongoDB)
- **Security:** JWT (JSON Web Tokens) & Passlib (Bcrypt)
---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3.11+](https://www.python.org/)
- [MongoDB](https://www.mongodb.com/) (Running locally or on Atlas)

### 1. Repository Setup
```bash
git clone https://github.com/manasodak19/Medora.git
cd Medora
```

### 2. Backend Initialization
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
pip install -r requirements.txt
# Start Server:
uvicorn main:app --reload
```
*The default admin account will be automatically seeded: `admin@medora.com` / `admin123`*

### 3. Frontend Initialization
```bash
cd ../frontend
npm install
# Start Dev Server:
npm run dev
```

---

## 📸 Visuals & Interaction
Medora utilizes **Glassmorphism** and a vibrant, professional color palette (Deep Sea Blues and Emerald Greens) to ensure a premium user experience.

- **Frontend URL:** `http://localhost:5173` (or `5174`)
- **Backend API Docs:** `http://localhost:8000/docs`

---

## 🤝 The Team
- **Manas Odak** - Architecture & Core Development
- **Atharva Mahajan** - Frontend Refactoring & UI/UX Enhancements
- **Anushka** - Admin Dashboards & System Logic
- **Shreya** - Feature Development

---

*Developed for the Semester 4 CEP Project.*
