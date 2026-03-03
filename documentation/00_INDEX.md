# 00 — Documentation Index

**Project**: Market Basket Analysis — Full-Stack Web Application  
**Frontend**: React 18 + TypeScript (Vite) — **COMPLETE**  
**Backend**: Python Flask — **PENDING**  
**Last Updated**: March 3, 2026

---

## File List

| # | File | What's Inside |
|---|------|---------------|
| 01 | `01_project_overview.md` | First written overview — what the project is, Amazon-style recommendations, tech stack, dataset, 2 panels (Customer + Admin), how MBA works |
| 02 | `02_data_mining_addition.md` | Why data mining was added beyond basic MBA — covers K-Means clustering, Decision Tree classifier, FP-Growth vs Apriori benchmark, how all 3 plug into the website |
| 03 | `03_website_guide.md` | Complete website guide — lists every single page in both panels, what each page shows, wireframe-style description, all features planned |
| 04 | `04_project_overview_detailed.md` | Deep-dive project overview — goals table, full folder structure diagram, all technology choices explained, current build status |
| 05 | `05_data_mining_concepts.md` | Data mining theory explained — Support, Confidence, Lift formulas with examples, Apriori vs FP-Growth algorithm steps, K-Means RFM analysis, Decision Tree confusion matrix, how rules power recommendations in code |
| 06 | `06_frontend_architecture.md` | How the React app is built — entry points, all 11 routes, CartContext explained with interface, mock products data, Recharts components used, key design patterns (useMemo, drag-drop, progress simulation, CSV download) |
| 07 | `07_customer_panel_pages.md` | Every customer-facing page in detail — Home (hero/stats/products), Shop (search/filter/sort), ProductDetail (FBT bundle + "Customers Also Bought" with confidence bars), Cart (recommendation scoring algorithm), SearchResults (placeholder) |
| 08 | `08_admin_panel_pages.md` | Every admin page in detail — Dashboard (stat cards + 4 charts), Rules (sliders + scatter + heatmap + sortable table + CSV export), Segmentation (K-Means scatter + segment cards + elbow curve), Prediction (metrics + confusion matrix + predictor demo), AlgorithmCompare (benchmark table + bar charts), DataUpload (drag-drop + progress + retrain settings) |
| 09 | `09_styling_system.md` | How CSS is organised — all CSS variables (colors, radius), file structure by section (~1,300 lines), button system, card pattern, responsive breakpoints, animations (float, hover lift, confidence bar fill) |
| 10 | `10_backend_plan.md` | Full Flask backend that still needs to be built — `train.py` with FP-Growth + K-Means + Decision Tree code, `app.py` with all 5 API routes, `recommender.py` helper, how to connect React Axios calls to each endpoint |
| 11 | `11_how_to_run.md` | Step-by-step run guide — how to start the frontend now, how to run backend once built, how to run both together, full dependency tables, common errors + fixes, Git workflow, complete project checklist |

---

## Quick Status

```
✅ DONE                          ❌ PENDING
─────────────────────────────    ──────────────────────────────
React project setup              SearchResults page
CartContext + Navbar             Flask backend (app.py)
App.tsx (11 routes)              train.py (model training)
Home page                        recommender.py
Shop page                        retail.csv dataset
Product Detail (FBT recs)        API connection (Axios → Flask)
Cart page (live recs)            End-to-end live testing
Admin Dashboard
Admin Rules page
Admin Segmentation
Admin Prediction
Admin Algorithm Compare
Admin Data Upload
Full CSS (~1,300 lines)
Zero TypeScript errors
```

---

## How the Docs Are Grouped

**Files 01–03** → Original planning documents written at the start of the project  
**Files 04–11** → Detailed technical documentation written after building was complete

---

## Key Numbers

| Metric | Value |
|--------|-------|
| Total React pages | 11 |
| Total CSS lines | ~1,300 |
| Mock products | 20 |
| Dataset transactions | 541,909 |
| Dataset products | 4,070 |
| Rules mined | 847 |
| Countries in dataset | 38 |
| npm dependencies | 8 |
| Python dependencies | 7 |
