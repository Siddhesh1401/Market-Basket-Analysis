# 07 — Backend Plan (Flask API)

## Overview

The Flask backend is the data engine. It loads the retail dataset, trains the models, saves them as `.pkl` files, and exposes a REST API that the React frontend calls via Axios.

**Status**: NOT YET BUILT — this is the plan.

---

## Folder Structure

```
backend/
├── app.py               ← Flask REST API server
├── train.py             ← Standalone script to train all models
├── recommender.py       ← Recommendation query logic
├── requirements.txt     ← Python dependencies
├── models/              ← Saved trained model files
│   ├── rules.pkl        ← Mined association rules (FP-Growth)
│   ├── kmeans.pkl       ← Trained K-Means model
│   └── dtree.pkl        ← Trained Decision Tree model
└── data/
    └── retail.csv       ← Download from Kaggle (user must place here)
```

---

## Python Dependencies (`requirements.txt`)

```
flask==3.0.3
flask-cors==4.0.1
pandas==2.2.2
numpy==1.26.4
mlxtend==0.23.1
scikit-learn==1.5.0
joblib==1.4.2
```

---

## Training Script (`train.py`)

This script is run ONCE to train all models and save them. Run it before starting the Flask server.

```python
import pandas as pd
import numpy as np
from mlxtend.frequent_patterns import fpgrowth, association_rules
from mlxtend.preprocessing import TransactionEncoder
from sklearn.cluster import KMeans
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# ── Load Data ──────────────────────────────────────────────────────────────
df = pd.read_csv("data/retail.csv", encoding="latin-1")
df.dropna(subset=["InvoiceNo", "CustomerID"], inplace=True)
df = df[~df["InvoiceNo"].astype(str).str.startswith("C")]  # remove cancellations
df = df[df["Quantity"] > 0]

# ── Step 1: FP-Growth Association Rules ────────────────────────────────────
# Build basket: each row is a transaction, each column is a product
basket = df.groupby(["InvoiceNo", "Description"])["Quantity"].sum().unstack(fill_value=0)
basket = basket.applymap(lambda x: True if x > 0 else False)

# Mine frequent itemsets
frequent_itemsets = fpgrowth(basket, min_support=0.01, use_colnames=True)
rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)
rules = rules[rules["confidence"] >= 0.2]

joblib.dump(rules, "models/rules.pkl")
print(f"Saved {len(rules)} rules")

# ── Step 2: K-Means Customer Segmentation (RFM) ────────────────────────────
df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"])
snapshot_date = df["InvoiceDate"].max()

rfm = df.groupby("CustomerID").agg({
    "InvoiceDate": lambda x: (snapshot_date - x.max()).days,   # Recency
    "InvoiceNo": "nunique",                                      # Frequency
    "UnitPrice": lambda x: (x * df.loc[x.index, "Quantity"]).sum()  # Monetary
}).rename(columns={"InvoiceDate": "Recency", "InvoiceNo": "Frequency", "UnitPrice": "Monetary"})

from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
rfm_scaled = scaler.fit_transform(rfm)

kmeans = KMeans(n_clusters=3, random_state=42)
kmeans.fit(rfm_scaled)

joblib.dump({"model": kmeans, "scaler": scaler, "rfm": rfm}, "models/kmeans.pkl")
print("Saved K-Means model")

# ── Step 3: Decision Tree Purchase Prediction ──────────────────────────────
# Example: predict if customer buys "WHOLE MILK"
target_product = "WHOLE MILK"
X = basket.drop(columns=[target_product], errors="ignore")
y = basket[target_product].astype(int)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
dtree = DecisionTreeClassifier(max_depth=5, random_state=42)
dtree.fit(X_train, y_train)

joblib.dump({"model": dtree, "features": list(X.columns)}, "models/dtree.pkl")
print("Saved Decision Tree model")
print("Training complete!")
```

---

## Flask API (`app.py`)

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  # Allow React frontend (localhost:5173) to call this API

# Load trained models on startup
rules = joblib.load("models/rules.pkl")
kmeans_data = joblib.load("models/kmeans.pkl")
dtree_data = joblib.load("models/dtree.pkl")

# ── /api/recommend ──────────────────────────────────────────────────────────
# Input:  { "cart": ["WHOLE MILK", "BREAD"] }
# Output: { "recommendations": [{ "product": "BUTTER", "confidence": 0.78, "lift": 2.3 }] }
@app.route("/api/recommend", methods=["POST"])
def recommend():
    cart_items = request.json.get("cart", [])
    recs = []
    for item in cart_items:
        matching = rules[rules["antecedents"].apply(lambda x: item in x)]
        for _, row in matching.iterrows():
            for product in row["consequents"]:
                if product not in cart_items:
                    recs.append({
                        "product": product,
                        "confidence": round(row["confidence"], 3),
                        "lift": round(row["lift"], 3)
                    })
    # Sort by confidence descending, deduplicate
    seen = set()
    unique_recs = []
    for r in sorted(recs, key=lambda x: -x["confidence"]):
        if r["product"] not in seen:
            seen.add(r["product"])
            unique_recs.append(r)
    return jsonify({"recommendations": unique_recs[:10]})

# ── /api/rules ──────────────────────────────────────────────────────────────
# Returns all mined rules as JSON
@app.route("/api/rules", methods=["GET"])
def get_rules():
    min_conf = float(request.args.get("min_confidence", 0.2))
    min_lift = float(request.args.get("min_lift", 1.0))
    min_supp = float(request.args.get("min_support", 0.01))
    filtered = rules[
        (rules["confidence"] >= min_conf) &
        (rules["lift"] >= min_lift) &
        (rules["support"] >= min_supp)
    ]
    result = []
    for _, row in filtered.iterrows():
        result.append({
            "antecedent": ", ".join(list(row["antecedents"])),
            "consequent": ", ".join(list(row["consequents"])),
            "support": round(row["support"], 4),
            "confidence": round(row["confidence"], 3),
            "lift": round(row["lift"], 3)
        })
    return jsonify({"rules": result, "count": len(result)})

# ── /api/stats ──────────────────────────────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def get_stats():
    df = pd.read_csv("data/retail.csv", encoding="latin-1")
    return jsonify({
        "total_transactions": int(df["InvoiceNo"].nunique()),
        "total_products": int(df["Description"].nunique()),
        "total_rules": len(rules),
        "total_countries": int(df["Country"].nunique())
    })

# ── /api/train ──────────────────────────────────────────────────────────────
# Trigger retraining (called from DataUpload page)
@app.route("/api/train", methods=["POST"])
def retrain():
    import subprocess
    subprocess.Popen(["python", "train.py"])
    return jsonify({"status": "training_started"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
```

---

## Recommender Helper (`recommender.py`)

```python
import joblib

rules = joblib.load("models/rules.pkl")

def get_recommendations(cart_items: list, top_n: int = 5) -> list:
    """
    Given a list of product names in the cart,
    return top N recommendations sorted by confidence × lift score.
    """
    scores = {}
    for item in cart_items:
        matching = rules[rules["antecedents"].apply(lambda x: item in x)]
        for _, row in matching.iterrows():
            for product in row["consequents"]:
                if product not in cart_items:
                    score = row["confidence"] * row["lift"]
                    if product not in scores or scores[product] < score:
                        scores[product] = score
    return sorted(scores.items(), key=lambda x: -x[1])[:top_n]
```

---

## Connecting React Frontend to Flask

Once Flask is running at `http://localhost:5000`, update these files:

### Cart.tsx — Replace mock recommendations with live API
```tsx
// Replace the getRecommendations() mock function with:
useEffect(() => {
  if (cartItems.length === 0) { setRecs([]); return; }
  axios.post("http://localhost:5000/api/recommend", {
    cart: cartItems.map(item => item.name.toUpperCase())
  }).then(res => {
    setRecs(res.data.recommendations.slice(0, 3));
  });
}, [cartItems]);
```

### Rules.tsx — Replace mock rules with live data
```tsx
useEffect(() => {
  axios.get("http://localhost:5000/api/rules", {
    params: { min_support: minSupport, min_confidence: minConf, min_lift: minLift }
  }).then(res => setRules(res.data.rules));
}, [minSupport, minConf, minLift]);
```

### Dashboard.tsx — Replace hardcoded stats
```tsx
useEffect(() => {
  axios.get("http://localhost:5000/api/stats").then(res => setStats(res.data));
}, []);
```

---

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recommend` | Get recommendations for a cart |
| GET | `/api/rules` | Get all rules (with filter params) |
| GET | `/api/stats` | Get dataset statistics |
| GET | `/api/products` | Get product list |
| POST | `/api/train` | Trigger model retraining |
