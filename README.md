# 🏥 Medora: Localized Medicine Locator & Inventory Tracker

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://medora-delta-one.vercel.app/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://medora-cado.onrender.com)

**Medora** is a premium, full-stack healthcare ecosystem designed to eliminate the uncertainty of finding life-saving medications. Built with a "Clean-First" philosophy, it features a glassmorphic user interface and complex geospatial logic to connect patient needs with pharmacy inventory in real-time.

---

## 🌐 Live Demo

| Service | Link |
| :--- | :--- |
| 🖥️ **Frontend (Vercel)** | [medora-delta-one.vercel.app](https://medora-delta-one.vercel.app/) |
| ⚙️ **Backend API (Render)** | [medora-cado.onrender.com](https://medora-cado.onrender.com) |

> ⚠️ **Note:** The backend is hosted on Render's free tier, which spins down after periods of inactivity. The first request after idle time may take **30–50 seconds** to respond while the server cold-starts.

---

## ✨ System Highlights

### 🔍 For Patients (The Navigator)
- **Smart Search & Locate:** Find medicines instantly with real-time stock status across your city.
- **Geospatial Discovery:** Automatically calculates distances to the nearest pharmacy using the **Haversine formula**.
- **Interactive Mapping:** Visualized pharmacy locations and interactive pins powered by **Leaflet**.
- **QR Booking System:** Generate secure tokens to "reserve" inventory for a frictionless pickup experience.

### 🛡️ For Pharmacists (The Storefront)
- **Inventory Control:** A beautiful, responsive dashboard to manage stock levels, pricing, and availability.
- **Real-time Alerts:** Integrated **Toast Notifications** for every stock update and order booking.
- **Secure Access:** Enterprise-grade JWT authentication to protect your store's data.

### 👑 For Admins (The Command Center)
- **Verification Inbox Spotlight:** A prioritized task queue for reviewing and verifying new pharmacy registrations one-click at a time.
- **Global Insights:** Monitor total users, verified pharmacies, and platform-wide inventory health.
- **System Pulse:** Integrated health indicators to monitor backend connectivity in real-time.

---

## 🎨 Premium UX Features

- **Glassmorphic UI:** Modern design language utilizing transparency, deep shadows, and professional color palettes.
- **Animated Skeleton Loaders:** Shimmering loading states that improve perceived performance during data fetching.
- **Global Notification Suite:** Sleek, slide-in toasts (via `react-hot-toast`) for immediate user feedback.

---

## 🛠️ Technical Architecture

### Core Stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Lucide-React, Leaflet, React Router DOM |
| **Backend** | FastAPI, Python 3.11, Pydantic, Motor (Async MongoDB) |
| **Database** | MongoDB Atlas (Cloud NoSQL) |
| **Security** | JWT Tokens, Bcrypt Hashing, PASSLIB |

### Deployment Stack
| Layer | Platform | URL |
| :--- | :--- | :--- |
| **Frontend** | Vercel | [medora-delta-one.vercel.app](https://medora-delta-one.vercel.app/) |
| **Backend** | Render | [medora-cado.onrender.com](https://medora-cado.onrender.com) |
| **Database** | MongoDB Atlas | Managed cloud cluster |

```text
┌─────────────────┐        HTTPS         ┌─────────────────┐        MongoDB Driver       ┌──────────────────┐
│   React Client   │ ───────────────────▶ │   FastAPI API    │ ───────────────────────────▶ │  MongoDB Atlas    │
│  (Vercel - CDN)  │ ◀─────────────────── │  (Render - Web   │ ◀─────────────────────────── │  (Cloud Cluster)  │
│                   │      JSON / REST     │   Service)        │         Async (Motor)         │                    │
└─────────────────┘                       └─────────────────┘                               └──────────────────┘
```

### Project Directory Structure
```text
📦 Medora
 ┣ 📂 backend            # FastAPI Server & Database Logic
 ┃ ┣ 📂 routes           # Modular API Endpoints (Auth, Admin, Inventory)
 ┃ ┣ 📜 main.py          # Application Entry Point
 ┃ ┗ 📜 database.py      # MongoDB Configuration
 ┣ 📂 frontend           # React Vite Client
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 components     # Reusable UI (Skeletons, Nav, Cards)
 ┃ ┃ ┣ 📂 pages          # Role-based Dashboards & Auth
 ┃ ┃ ┗ 📜 api.js         # Axios-based Service Layer
 ┗ 📜 README.md          # Project Documentation
```

---

## 🚀 Future Roadmap & Scope

We're not just building an app; we're building a network.
- [ ] **AI-Powered Medicine Interactions:** Check for contraindications between drugs in your cart.
- [ ] **Smart Pill Reminders:** Integrated mobile push notifications for medication schedules.
- [ ] **IoT Smart Cabinets:** Connecting Medora directly to pharmacy hardware for real-time inventory precision.
- [ ] **Telemedicine Portal:** Instant consults with partner doctors directly through the search results.
- [ ] **Multi-language Support:** For better accessibility across diverse demographics.

---

## 🏗️ Local Development

### Prerequisites
- Node.js (v18+)
- Python 3.11+
- MongoDB instance (Local or Atlas)

### 1. Setup Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```

Run the server:
```bash
uvicorn main:app --reload
```

### 2. Setup Frontend
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory, pointing to your local backend:
```env
VITE_API_BASE_URL=http://localhost:8000
```

Run the dev server:
```bash
npm run dev
```

---

## ☁️ Deployment Notes

- **Frontend (Vercel):** Deployed directly from the `frontend` directory. Set the `VITE_API_BASE_URL` environment variable in Vercel's project settings to `https://medora-cado.onrender.com`.
- **Backend (Render):** Deployed as a Web Service from the `backend` directory, with `uvicorn main:app --host 0.0.0.0 --port $PORT` as the start command. Set `MONGO_URI` and `JWT_SECRET` as environment variables in Render's dashboard.
- **Database (MongoDB Atlas):** Ensure the cluster's network access allows connections from Render (either via `0.0.0.0/0` for simplicity or Render's specific outbound IPs for tighter security).

---

## 🤝 The Team

- **Manas Odak** - [GitHub]() • [LinkedIn]()
- **Atharva Mahajan** - [GitHub]() • [LinkedIn]()
- **Anushka** - [GitHub]() • [LinkedIn]()
- **Shreya** - [GitHub]() • [LinkedIn]()

---

*Developed for the Semester 4 CEP Project. 🏥 Stay Healthy!*
