# AI-Powered Emotional Well-Being Monitoring Assistant

An intelligent, safety-aware web application designed to support personal mental wellness through daily check-ins, reflective journaling, AI-assisted emotional analysis, historical trend monitoring, and personalized supportive insights.

---

## 🏗️ Technology Architecture

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (Async), Alembic, Pydantic v2
- **Database**: PostgreSQL 16 (via Docker Compose or local instance)
- **AI Engine**: Google Gemini API *(planned)*
- **Authentication**: Firebase Authentication *(planned)*

---

## 📋 Prerequisites

Before running the project locally, ensure you have the following installed:

- **Node.js**: `v18.0+` or `v20.0+` (recommended: `v20+` or `v22+`)
- **Python**: `3.11+`
- **Docker & Docker Compose**: Optional for containerized PostgreSQL (or a standalone PostgreSQL server)
- **Git**

---

## 🚀 Getting Started

### 1. Database Setup (PostgreSQL)

You can run PostgreSQL locally using Docker Compose:

```bash
# Start PostgreSQL in the background
docker compose up -d

# Check PostgreSQL container logs
docker compose logs -f postgres

# Stop PostgreSQL container
docker compose down
```

*Note: Default credentials configured in `docker-compose.yml`:*
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `ai_wellbeing_db`

---

### 2. Backend Setup (FastAPI)

```bash
# Navigate to the backend directory
cd backend

# Create a Python virtual environment (if not already created)
python -m venv .venv

# Activate the virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Windows (CMD):
.venv\Scripts\activate.bat
# On macOS / Linux:
source .venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Run database migrations (once database is running)
alembic upgrade head

# Start the FastAPI development server with hot-reloading
uvicorn app.main:app --reload --port 8000
```

The backend server will be available at:
- **API Base URL**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

### 3. Frontend Setup (Next.js)

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Copy environment configuration
cp .env.local.example .env.local

# Start the Next.js development server
npm run dev
```

The frontend application will be available at:
- **Web App**: `http://localhost:3000`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_NAME` | Name of the FastAPI application | `"Emotional Well-Being Assistant API"` |
| `ENVIRONMENT` | Environment mode (`development` / `production`) | `"development"` |
| `DEBUG` | Enable debug mode | `true` |
| `PORT` | Backend listening port | `8000` |
| `HOST` | Backend listening host | `"0.0.0.0"` |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `"http://localhost:3000,http://127.0.0.1:3000"` |
| `DATABASE_URL` | Async PostgreSQL connection string | `"postgresql+asyncpg://postgres:postgres@localhost:5432/ai_wellbeing_db"` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | User-facing application title | `"AuraWell - Emotional Well-Being Assistant"` |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend | `"http://localhost:8000"` |

---

## 🩺 System Verification Endpoints

- **Backend Health Check**:
  ```http
  GET http://localhost:8000/health
  ```
  *Response Sample:*
  ```json
  {
    "status": "healthy",
    "environment": "development",
    "timestamp": "2026-09-01T21:00:00.000000+00:00",
    "database": {
      "status": "connected",
      "database": "postgresql"
    }
  }
  ```

---

## 📁 Repository Directory Structure

```text
ai-project/
├── .gitignore
├── docker-compose.yml              # Local PostgreSQL 16 service
├── README.md                       # Setup & run instructions
│
├── backend/                        # FastAPI Python backend
│   ├── .env.example
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/                    # Database migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # FastAPI application & CORS
│       ├── config.py               # Pydantic Settings
│       ├── database.py             # SQLAlchemy Async Engine & Session
│       ├── api/                    # API route definitions
│       ├── models/                 # SQLAlchemy database models
│       ├── schemas/                # Pydantic validation schemas
│       └── services/               # Core business & AI services
│
└── frontend/                       # Next.js 14+ App Router frontend
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    ├── next.config.ts
    ├── .env.local.example
    └── src/
        ├── app/
        │   ├── layout.tsx          # Root layout
        │   ├── page.tsx            # Wellness landing page & live health checker
        │   └── globals.css         # Design tokens & styles
        └── lib/
            ├── api.ts              # Backend API helper
            └── utils.ts
```
