# 08 — How to Run the Project

## Current State

The **React frontend is fully complete** and runnable right now.  
The **Flask backend** is not yet built — pages use mock/demo data until it's connected.

---

## Running the Frontend (Works Right Now)

### Prerequisites
- Node.js 18+ installed
- npm 9+

### Steps

```bash
# 1. Navigate to frontend folder
cd "c:\Users\SIDDHESH\Desktop\market basket\frontend"

# 2. Install dependencies (only needed once)
npm install

# 3. Start the development server
npm run dev
```

### Access the App
Open your browser and go to: **http://localhost:5173**

| Page | URL |
|------|-----|
| Home | http://localhost:5173/ |
| Shop | http://localhost:5173/shop |
| Product (example) | http://localhost:5173/product/1 |
| Cart | http://localhost:5173/cart |
| Admin Dashboard | http://localhost:5173/admin |
| Admin Rules | http://localhost:5173/admin/rules |
| Admin Segmentation | http://localhost:5173/admin/segmentation |
| Admin Prediction | http://localhost:5173/admin/prediction |
| Algorithm Compare | http://localhost:5173/admin/algorithm |
| Data Upload | http://localhost:5173/admin/upload |

---

## Running the Backend (When Built)

### Prerequisites
- Python 3.10+ installed
- pip package manager
- `retail.csv` dataset placed in `backend/data/`

### Get the Dataset
1. Go to: https://www.kaggle.com/datasets/carrie1/ecommerce-data
2. Download `data.csv`
3. Rename it to `retail.csv`
4. Place at: `c:\Users\SIDDHESH\Desktop\market basket\backend\data\retail.csv`

### Steps

```bash
# 1. Navigate to backend folder
cd "c:\Users\SIDDHESH\Desktop\market basket\backend"

# 2. Create a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Train all models (run ONCE, takes ~30 seconds)
python train.py

# 5. Start the Flask server
python app.py
```

Flask API will be running at: **http://localhost:5000**

---

## Running Both Together (Full Stack)

Open two terminals simultaneously:

**Terminal 1 — Backend:**
```bash
cd "c:\Users\SIDDHESH\Desktop\market basket\backend"
venv\Scripts\activate
python app.py
```

**Terminal 2 — Frontend:**
```bash
cd "c:\Users\SIDDHESH\Desktop\market basket\frontend"
npm run dev
```

Then open **http://localhost:5173** — all pages will now use live data from the Flask API.

---

## Build for Production

When the project is ready to submit/deploy:

```bash
# Build the React app (creates frontend/dist/ folder)
cd "c:\Users\SIDDHESH\Desktop\market basket\frontend"
npm run build

# The dist/ folder can be uploaded to any static host (Netlify, GitHub Pages, Vercel)
# Or served by Flask directly using Flask's static file serving
```

---

## Installed Dependencies Summary

### Frontend (`frontend/package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.x | UI framework |
| react-dom | 18.x | DOM rendering |
| react-router-dom | 7.13.1 | Client-side routing |
| recharts | 3.7.0 | Charts (bar, line, pie, scatter) |
| react-icons | 5.5.0 | Icons (FiShoppingCart, MdDashboard, etc.) |
| axios | 1.13.6 | HTTP client for Flask API calls |
| typescript | 5.x | Type safety |
| vite | 6.x | Build tool & dev server |

### Backend (`backend/requirements.txt`)
| Package | Version | Purpose |
|---------|---------|---------|
| flask | 3.0.3 | Web API server |
| flask-cors | 4.0.1 | Allow frontend to call API |
| pandas | 2.2.2 | Data loading and processing |
| numpy | 1.26.4 | Numerical operations |
| mlxtend | 0.23.1 | Apriori and FP-Growth algorithms |
| scikit-learn | 1.5.0 | K-Means and Decision Tree |
| joblib | 1.4.2 | Save/load trained models (.pkl) |

---

## Common Issues & Fixes

### "npm run dev" fails — port 5173 already in use
```bash
# Kill the existing process and retry
npx kill-port 5173
npm run dev
```

### Frontend shows blank page
Check browser console for errors. Usually:
- Missing import in a .tsx file
- TypeScript error that blocks compilation

### Rules page shows no data after clicking "Run"
This is the expected behavior — mock data is hardcoded. Rules are filtered by the sliders but the base data is static. Connect Flask for live data.

### "Cannot find module" on npm run dev
```bash
# Reinstall all dependencies
rm -rf node_modules
npm install
```

### Python `mlxtend` install fails
```bash
pip install mlxtend --no-cache-dir
```

---

## Git Workflow (Recommended)

```bash
# Initial commit
git init
git add .
git commit -m "Initial: Full React frontend with all 11 pages"

# After adding backend
git add backend/
git commit -m "Add: Flask backend with FP-Growth and K-Means"

# After connecting API
git add .
git commit -m "Connect: React frontend to Flask REST API"
```

---

## Project Checklist

- [x] React project setup (Vite + TypeScript)
- [x] All dependencies installed
- [x] CartContext (global cart state)
- [x] Navbar with search + cart badge
- [x] App.tsx with all 11 routes
- [x] Home page
- [x] Shop page with filters
- [x] Product Detail with FBT recommendations
- [x] Cart page with live recommendation box
- [x] Admin Dashboard with charts
- [x] Admin Rules explorer
- [x] Admin Segmentation clustering
- [x] Admin Purchase Prediction
- [x] Admin Algorithm Compare
- [x] Admin Data Upload
- [x] Full CSS styling (1,300+ lines)
- [x] Zero TypeScript errors
- [ ] SearchResults page (placeholder)
- [ ] Flask backend (`app.py`, `train.py`, `recommender.py`)
- [ ] Model training on retail.csv
- [ ] Connect React Axios calls to Flask API
- [ ] End-to-end testing with live data
