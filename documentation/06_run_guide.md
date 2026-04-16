# 06 - Run Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

---

## Backend Setup

```bash
cd backend
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python app.py
```

Backend default URL:

- `http://localhost:5000`

Quick checks:

- `GET /api/health`
- `GET /`

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL:

- `http://localhost:5173`

---

## Core End-to-End Check

1. Open Dashboard
2. Upload `sample_transactions.csv` (or another valid CSV)
3. Click Analyze Dataset
4. Confirm KPI cards and charts populate
5. Open Reports and verify visualizations render

---

## Optional Model Training (for model endpoints)

```bash
cd backend
python train.py
```

This generates model files in `backend/models/` for endpoints like:

- `/api/recommendations`
- `/api/rules`
- `/api/segments`
- `/api/predict`

---

## Known Environment Caveat

If you see NumPy/PyArrow compatibility warnings in local Python environment:

- Create and use an isolated virtual environment
- Reinstall dependencies in that environment
- Prefer consistent versions from `backend/requirements.txt`

---

## Build Checks

Frontend build:

```bash
cd frontend
npm run build
```

Backend syntax check:

```bash
cd backend
python -m compileall app.py mining_live.py recommender.py train.py
```
