# 06 - Run Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## For New Contributors (Clone to Run)

If you are setting this up for the first time, follow this exact order.

### 1) Clone the project

```bash
git clone <your-repo-url>
cd "market basket"
```

## First-Time Setup

Run these once.

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

## Gemini API Setup (Schema Mapping AI)

This is optional. The app still works without Gemini using rule-based mapping.

Project owner will provide these to contributors:

- GEMINI_API_KEY (credential)
- Approved GEMINI_MODEL
- Allowed rate limits and usage policy (for example requests/minute, requests/day, quota rules)

Setup:

1. In backend folder, copy `.env.example` to `.env`
2. Put the owner-provided values in `.env`

Example:

```bash
GEMINI_API_KEY=owner_provided_key
GEMINI_MODEL=owner_approved_model
```

Important:

- Never commit `backend/.env`
- Never hardcode API keys in source code
- If you do not have credentials yet, continue without Gemini (app is still usable)

## Start the App

### Terminal 1 (Backend)

```bash
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```

Backend runs on `http://localhost:5000`.

### Terminal 2 (Frontend)

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Daily Startup

After first-time setup, use only these two commands:

```bash
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```

```bash
cd frontend
npm run dev
```

## Quick End-to-End Check

1. Open `http://localhost:5173`
2. Upload `sample_transactions.csv`
3. Click **Analyze Dataset**
4. Confirm charts/KPIs load in Workspace or Reports
5. Open **BI** page and verify Report/Data/Model views load
6. Open backend root `http://localhost:5000` and confirm endpoint list appears

Quick API checks:

- `GET http://localhost:5000/api/health`
- `GET http://localhost:5000/api/bi/overview` (works after dataset analysis)
- `POST http://localhost:5000/api/schema-suggest` (Gemini-assisted mapping if key is configured)

## When to Reinstall

- Run `pip install -r requirements.txt` only if Python dependencies changed, or `.venv` was recreated.
- Run `npm install` only if `package.json`/lockfile changed, or `node_modules` was removed.

## Optional: Train Models

Use this only if you need trained-model/fallback endpoints.

```bash
cd backend
python train.py
```

This writes model files into `backend/models/`.

## Basic Troubleshooting

- Backend fails to start: activate `.venv` and reinstall `pip install -r requirements.txt`
- Frontend fails to start: run `npm install` in `frontend`
- BI/advanced pages show no data: upload and analyze dataset first in Workspace
- Gemini not used: check `backend/.env` values and restart backend

## Build Checks

```bash
cd frontend
npm run build
```

```bash
cd backend
python -m compileall app.py mining_live.py recommender.py train.py
```
