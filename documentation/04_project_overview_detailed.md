# 01 — Project Overview

## What Is This Project?

This is a **Market Basket Analysis (MBA) Web Application** — a full-stack data mining project that mimics how Amazon recommends products. When a customer browses or adds items to their cart, the system uses association rules mined from real transaction data to suggest products they are likely to buy next.

Built as a school/college data mining project, this app demonstrates:
- Association Rule Mining (Apriori & FP-Growth)
- Customer Segmentation (K-Means Clustering)
- Purchase Prediction (Decision Tree Classifier)
- A fully functional e-commerce style frontend

---

## The Core Idea

> "Customers who bought **Milk** also bought **Bread** 78% of the time."

This is called an **Association Rule**. The system mines thousands of such rules from a real dataset of 541,909 transactions and uses them to power a live recommendation engine.

---

## Dataset

- **Name**: Online Retail Dataset
- **Source**: Kaggle / UCI Machine Learning Repository
- **Transactions**: 541,909
- **Unique Products**: 4,070
- **Countries**: 38
- **Date Range**: Dec 2010 – Dec 2011
- **File**: `backend/data/retail.csv` (to be placed by user)

---

## Project Goals

| Goal | Status |
|------|--------|
| Build a shopping website with live recommendations | ✅ Frontend done |
| Mine association rules from real transaction data | ⏳ Backend pending |
| Visualize rules in an admin dashboard | ✅ Frontend done |
| Segment customers using K-Means | ✅ Frontend done (mock data) |
| Predict purchases using Decision Tree | ✅ Frontend done (mock data) |
| Compare Apriori vs FP-Growth algorithms | ✅ Frontend done (mock data) |
| Connect frontend to Flask API | ⏳ Backend pending |

---

## Two Panels

### 1. Customer Panel
The shopping-facing side — like Amazon or Flipkart. Customers browse products, view details, add to cart, and get real-time recommendations powered by association rules.

### 2. Admin Panel
The analytics dashboard — only for the project owner/demo. Shows all the data mining results: mined rules, customer clusters, prediction accuracy, algorithm benchmarks, and allows uploading new datasets to retrain.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Routing | react-router-dom v7 |
| Charts | Recharts |
| Icons | react-icons |
| HTTP Client | Axios |
| Styling | Custom CSS (no frameworks) |
| Backend (pending) | Python Flask |
| ML Library (pending) | mlxtend (Apriori/FP-Growth) |
| Clustering (pending) | scikit-learn KMeans |
| Classification (pending) | scikit-learn DecisionTreeClassifier |
| Data Processing (pending) | pandas, numpy |

---

## Project Folder Structure

```
market basket/
├── frontend/                    ← React app (COMPLETE)
│   ├── src/
│   │   ├── App.tsx              ← Routes
│   │   ├── index.css            ← All styles
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   ├── context/
│   │   │   └── CartContext.tsx
│   │   ├── data/
│   │   │   └── products.ts
│   │   └── pages/
│   │       ├── Home.tsx
│   │       ├── Shop.tsx
│   │       ├── ProductDetail.tsx
│   │       ├── Cart.tsx
│   │       ├── SearchResults.tsx
│   │       └── admin/
│   │           ├── AdminLayout.tsx
│   │           ├── Dashboard.tsx
│   │           ├── Rules.tsx
│   │           ├── Segmentation.tsx
│   │           ├── Prediction.tsx
│   │           ├── AlgorithmCompare.tsx
│   │           └── DataUpload.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     ← Flask API (PENDING)
│   ├── app.py
│   ├── train.py
│   ├── recommender.py
│   ├── requirements.txt
│   └── data/
│       └── retail.csv
│
└── documentation/               ← This folder
    ├── 01_project_overview.md
    ├── 02_data_mining_concepts.md
    ├── 03_frontend_architecture.md
    ├── 04_customer_panel_pages.md
    ├── 05_admin_panel_pages.md
    ├── 06_styling_system.md
    ├── 07_backend_plan.md
    └── 08_how_to_run.md
```
