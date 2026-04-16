# 01 - Project Snapshot

## What This Project Is

This project is a practical Market Basket Analysis web workspace with:

- A React frontend for CSV upload, dataset analysis, charts, and rule exploration
- A Flask backend for live association mining and supporting ML endpoints

The current product is an analytics workspace, not a full e-commerce storefront.

---

## Current User Flow

1. Open the app home page
2. Go to Dashboard
3. Upload CSV dataset
4. Click Analyze Dataset
5. Review KPIs, charts, and recommendation insights
6. Open Reports for executive-style visuals and top-rule table

---

## Current Frontend Scope

Implemented pages:

- Home
- Dashboard
- Reports

Implemented capabilities:

- CSV upload (browse and drag-drop)
- Live analysis request to backend (`/api/analyze`)
- Rule filtering (support, confidence, lift)
- Recommendation preview by selected product
- CSV export for filtered rules
- Report charts and top rules table

---

## Current Backend Scope

Implemented API groups:

- Health and service metadata
- Live CSV mining (`/api/analyze`)
- Model-based recommendation and analytics endpoints

Important note:

- The UI currently uses the live analysis endpoint only.
- Model-based endpoints rely on trained files in `backend/models/`.

---

## What Is Not Yet Implemented

- Professional multi-step navigation structure beyond Home/Dashboard/Reports
- Dedicated Basket Simulator page in frontend
- Run-history and comparison of multiple analyses
- Authentication and role-based access
- Automated unit/integration tests

---

## Documentation Alignment

This file replaces earlier planning docs that described a much larger planned UI. The new documentation set now reflects the repository as implemented today.
