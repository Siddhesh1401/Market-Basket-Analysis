# 00 - Documentation Index

Project: Market Basket Analysis Workspace (current implementation)
Last updated: April 16, 2026

This documentation set replaces the previous planning-heavy docs and now describes the project exactly as it exists in code today.

---

## Current Reality Snapshot

- Frontend routes: Home, Dashboard, Reports
- Primary workflow: Upload CSV -> Analyze -> Explore charts/rules
- Backend status: Flask API implemented and runnable
- Mining path used by UI: `/api/analyze` (live CSV analysis)
- Optional model endpoints exist for recommendations/segments/prediction, but require trained model files in `backend/models/`

---

## Documentation Map

| File | Purpose |
|---|---|
| `01_project_snapshot.md` | What the project is today, what is complete, and what is not yet built |
| `02_frontend_architecture.md` | Current frontend structure, route flow, and UI architecture notes |
| `03_backend_architecture.md` | Backend modules, endpoint groups, and model pipeline notes |
| `04_api_reference.md` | Request/response contract for all current Flask API endpoints |
| `05_data_contracts_and_mining.md` | Accepted CSV formats, cleaning logic, and mining output schema |
| `06_run_guide.md` | How to run backend/frontend, smoke checks, and troubleshooting |
| `07_future_roadmap.md` | Agreed forward plan (professional UI flow + Basket Simulator + next phases) |
| `phases/README.md` | Entry point for simple completed-phase notes and tester checklists |
| `phases/phase_2_1.md` | Simple summary and test checklist for Phase 2.1 |
| `phases/phase_2_2.md` | Simple summary and test checklist for Phase 2.2 |
| `phases/phase_2_3.md` | Simple summary and test checklist for Phase 2.3 |
| `phases/phase_2_4.md` | Simple summary and test checklist for Phase 2.4 |

---

## Notes

- Old documentation files were removed because they described a larger planned product that does not match the current repository state.
- Future improvements are tracked in `07_future_roadmap.md`.
