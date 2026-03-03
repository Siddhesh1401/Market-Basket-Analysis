# Market Basket Analysis — Full Project Overview

## What is This Project?
Market Basket Analysis is a data mining technique that finds patterns in customer purchase data.
It answers the question: "If a customer buys X, what else are they likely to buy?"
This project builds a full-fledged e-commerce style website (like Amazon) that:
- Trains an association rule model on real retail transaction data
- Serves live product recommendations through a Flask API
- Displays them on a React frontend — exactly like Amazon's "Customers also bought" feature

---

## Core Concept — How it Works

### Algorithms Used
- **Apriori** — Classic algorithm, scans dataset multiple times to find frequent itemsets
- **FP-Growth** — Faster alternative, builds a tree structure, better for large datasets

### Key Metrics
- **Support** = How often items appear together / total transactions
- **Confidence** = Given item A was bought, probability that item B is also bought
- **Lift** = How much more likely B is bought with A compared to randomly
  - Lift > 1 = positive association (good rule)
  - Lift = 1 = no association
  - Lift < 1 = negative association

### Example Rule
IF customer buys {Bread, Butter} → THEN they also buy {Milk}
- Support: 0.05 (appears in 5% of all transactions)
- Confidence: 0.72 (72% of people who bought Bread+Butter also bought Milk)
- Lift: 2.4 (2.4x more likely than random)

---

## Dataset
- **Name:** Online Retail Dataset
- **Source:** Kaggle (UCI Machine Learning Repository)
- **Size:** ~541,000 transactions
- **Fields:** InvoiceNo, StockCode, Description (product name), Quantity, InvoiceDate, UnitPrice, CustomerID, Country
- **Time Period:** December 2010 – December 2011
- **Retailer:** UK-based online gift store

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + CSS |
| Backend | Python + Flask |
| Algorithm | mlxtend (Apriori / FP-Growth) |
| Data Processing | pandas, numpy |
| Model Storage | pickle (.pkl file) |
| Charts | Recharts (React) / Plotly |
| API Communication | Axios (React → Flask) |

---

## Project Folder Structure

```
market-basket/
│
├── backend/
│   ├── app.py                → Main Flask server, all API routes
│   ├── train.py              → Load data, run algorithm, save rules.pkl
│   ├── recommender.py        → Query rules.pkl, return top recommendations
│   ├── rules.pkl             → Saved trained association rules
│   ├── products.json         → Product list for the fake store
│   └── data/
│       └── retail.csv        → Raw transaction dataset
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx      → Landing page
│   │   │   ├── Shop.jsx      → Product grid (fake store)
│   │   │   ├── Product.jsx   → Product detail + "Frequently Bought Together"
│   │   │   ├── Cart.jsx      → Cart page + live recommendations
│   │   │   └── Admin.jsx     → Dashboard: charts, rules table, retrain model
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── RecommendationBox.jsx  → The Amazon-style suggestion box
│   │   └── App.jsx
│   └── package.json
│
├── requirements.txt          → Python dependencies
└── README.md
```

---

## How Model Training Works

### Step-by-Step
1. Load retail.csv using pandas
2. Remove null values, cancelled orders (InvoiceNo starting with 'C')
3. Group transactions: each row = 1 invoice, columns = products (0 or 1)
4. Run Apriori or FP-Growth with minimum thresholds:
   - min_support = 0.01
   - min_confidence = 0.2
   - min_lift = 1.0
5. Generate association rules from frequent itemsets
6. Save rules to rules.pkl using pickle
7. Flask loads rules.pkl once on server startup
8. Every recommendation request just queries the loaded rules (no retraining)

### Train Once, Serve Forever
Training is done offline (takes 10-30 seconds).
The Flask API serves recommendations in milliseconds by querying saved rules.
New data → re-run train.py → new rules.pkl → Flask auto-reloads.

---

## Flask API Endpoints

| Endpoint | Method | Input | Output |
|---|---|---|---|
| /api/recommend | POST | { "items": ["Bread", "Butter"] } | Top 5 recommended products with confidence + lift |
| /api/rules | GET | — | All association rules |
| /api/stats | GET | — | Dataset stats (total transactions, unique items, top items) |
| /api/train | POST | CSV file upload | Retrains model, returns success message |
| /api/products | GET | — | Full product list for the store |

---

## Website Pages & Features

### Page 1 — Home / Landing Page
- Project title and description
- "Enter the Store" button
- Simple hero section

### Page 2 — Shop (Fake Store)
- Grid of product cards (image, name, price)
- "Add to Cart" button on each card
- As items are added → recommendation box appears live
- Looks and feels like a real e-commerce site

### Page 3 — Product Detail Page
- Full product info
- "Frequently Bought Together" section (powered by association rules)
- "Customers Also Viewed" section
- Add to cart button

### Page 4 — Cart Page
- List of items in cart
- Live recommendation box updates as cart changes:
  "Don't forget: Milk, Eggs, Jam"
- Confidence % shown for each recommendation
- Checkout button (UI only)

### Page 5 — Admin Dashboard
- Upload new CSV → retrain model button
- Table of all association rules (filterable, sortable)
- Heatmap: product co-occurrence matrix
- Scatter plot: support vs confidence (dot size = lift)
- Network graph: items as nodes, rules as arrows
- Download rules as CSV

---

## Live Recommendation Flow (How Amazon-style works)

```
User adds "Bread" to cart
        ↓
React sends: POST /api/recommend
Body: { "items": ["Bread"] }
        ↓
Flask queries rules.pkl:
- Find rules where antecedents contain "Bread"
- Sort by lift DESC
- Return top 5
        ↓
Flask responds:
{
  "recommendations": [
    { "item": "Butter",     "confidence": 0.78, "lift": 2.4 },
    { "item": "Milk",       "confidence": 0.65, "lift": 2.1 },
    { "item": "Eggs",       "confidence": 0.54, "lift": 1.9 },
    { "item": "Jam",        "confidence": 0.48, "lift": 1.7 },
    { "item": "Olive Oil",  "confidence": 0.42, "lift": 1.5 }
  ]
}
        ↓
React renders recommendation cards instantly
No page refresh — fully live
```

---

## Python Dependencies (requirements.txt)
```
flask
flask-cors
pandas
numpy
mlxtend
scikit-learn
pickle5
```

---

## React Dependencies (package.json key packages)
```
react
react-router-dom
axios
recharts
react-icons
```

---

## What Makes This Project Stand Out
1. Real dataset (541k transactions) — not fake/dummy data
2. Live recommendations — updates as cart changes, no page reload
3. Admin dashboard with interactive charts
4. Model retrain feature — upload new data and retrain from the website
5. Complete full-stack implementation — React + Flask + ML model
6. Mimics real-world e-commerce recommendation systems (Amazon, Flipkart)
