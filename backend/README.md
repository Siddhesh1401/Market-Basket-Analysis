# Gift Store Market Basket Analysis - Backend API

Complete Flask REST API with Machine Learning models for product recommendations in a gift store using Market Basket Analysis.

## Overview

This backend analyzes customer purchasing patterns from a gift store to:
- Find frequently bought together gift items
- Recommend complementary products to customers
- Segment customers by purchase behavior
- Predict customer purchase likelihood
- Generate association rules between products

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Train ML Models (One-time only, takes ~2-3 minutes)

```bash
python train.py
```

This trains:
- **Apriori Algorithm** - Finding frequent itemsets and association rules
- **FP-Growth Algorithm** - Faster association rule mining
- **K-Means Clustering** - Customer segmentation (5 clusters)
- **Decision Tree** - Purchase prediction

Models are saved in `models/` directory.

### 3. Start the Flask API Server

```bash
python app.py
```

API will be available at: **http://localhost:5000**

### Optional: Enable Gemini-Assisted Schema Mapping

Get a Gemini API key from Google AI Studio:

1. Open: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **Create API key**
4. Copy the generated key

Store the key securely (recommended `.env` flow):

1. Copy `.env.example` to `.env` inside `backend/`
2. Set your values:

```bash
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-2.5-flash
```

3. Start backend normally:

```bash
python app.py
```

Alternative (current terminal only):

```bash
set GEMINI_API_KEY=your_api_key_here
set GEMINI_MODEL=gemini-2.5-flash
```

Security notes:

- Never hardcode API keys in code.
- Never commit `.env` to GitHub.
- `backend/.env` is already ignored by git.

If `GEMINI_API_KEY` is not set, the app still works in rule-based schema mapping mode.

## API Endpoints

### Health Check
```
GET /api/health
```

### Analyze Uploaded CSV (Live Data Mining)
```
POST /api/analyze
Body: {
  "csv_text": "InvoiceNo,Description,...",
  "algorithm": "fpgrowth",  // or "apriori"
  "min_support": 0.01,
  "min_confidence": 0.1,
  "min_lift": 1.0,
  "column_mapping": {
    "item": "Product Name",
    "invoice": "Invoice No"
  }
}
Response: { "analysis": {...}, "algorithm": "fpgrowth" }
```

### Suggest CSV Schema Mapping
```
POST /api/schema-suggest
Body: {
  "csv_text": "Invoice No,Product Name,Qty,...",
  "sample_rows": 8,
  "use_ai": true,
  "ai_threshold": 0.75
}
Response: {
  "suggestion": {...},
  "source": "rule-based|hybrid-rule-gemini",
  "aiApplied": true|false,
  "aiConfigured": true|false
}
```

### Get Recommendations
```
POST /api/recommendations
Body: {
  "items": ["LUNCH BAG RED", "CAKE CASES"],
  "algorithm": "apriori",  // or "fpgrowth"
  "top_n": 5
}
Response: { "recommendations": [...] }
```

### Get Association Rules
```
GET /api/rules?algorithm=apriori&min_confidence=0.3&top_n=20
Response: { "rules": [...] }
```

### Get Customer Segment
```
POST /api/segments
Body: {
  "purchase_count": 10,
  "avg_price": 2.5,
  "total_quantity": 50
}
Response: { "segment": 0, "characteristics": {...} }
```

### Predict Purchase Likelihood
```
POST /api/predict
Body: {
  "products": ["LUNCH BAG RED", "CAKE TINS"]
}
Response: { "will_buy_high_quantity": 0.75, "confidence": 0.85 }
```

### Get Overall Analytics
```
GET /api/analytics
Response: {
  "total_transactions": 541910,
  "total_revenue": 9000000,
  "unique_products": 4070,
  "unique_customers": 4000,
  "avg_transaction_value": 16.61,
  "top_products": {...}
}
```

### Get All Products
```
GET /api/products
Response: { "products": ["LUNCH BAG RED", "CAKE CASES", ...] }
```

### Get Product Details
```
GET /api/products/{product_name}
Response: {
  "name": "LUNCH BAG RED",
  "total_sold": 629,
  "avg_price": 1.65,
  "frequency": 629,
  "total_revenue": 1038.85
}
```

### Get Frequently Bought Together
```
POST /api/fbt
Body: {
  "product": "LUNCH BAG RED",
  "top_n": 5
}
Response: { "frequently_bought_together": [...] }
```

### Get Model Status
```
GET /api/models
Response: {
  "apriori": true,
  "fpgrowth": true,
  "kmeans": true,
  "decision_tree": true
}
```

## Project Structure

```
backend/
├── app.py                 # Flask API server
├── train.py              # ML model training script
├── recommender.py        # Recommendation engine
├── requirements.txt      # Python dependencies
├── data/
│   └── retail.csv        # Dataset (541,910 transactions)
└── models/               # Trained models directory
    ├── apriori_model.pkl
    ├── fpgrowth_model.pkl
    ├── kmeans_model.pkl
    └── decision_tree_model.pkl
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| flask | 3.0.3 | Web API framework |
| flask-cors | 4.0.1 | CORS support |
| pandas | 2.2.2 | Data processing |
| numpy | 1.26.4 | Numerical operations |
| mlxtend | 0.23.1 | Apriori & FP-Growth |
| scikit-learn | 1.5.0 | K-Means & Decision Tree |
| joblib | 1.4.2 | Model persistence |

## Dataset

- **Store Type**: Gift & Home Decoration Store
- **Size**: 541,910 transactions
- **Products**: 4,070 unique gift items (bags, decorations, baking supplies, party items, etc.)
- **Period**: Dec 2010 - Dec 2011
- **Features**: InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID, Country
- **Data Contains**: Lunch bags, ornaments, cake tins, candle holders, party bunting, chalkboards, and more

## Next Steps

1. ✅ Backend API created
2. ⏳ Train models: `python train.py`
3. ⏳ Start server: `python app.py`
4. ⏳ Connect React frontend to API
5. ⏳ Test all endpoints

## Troubleshooting

**Models not loading?**
- Run `python train.py` first to generate models

**Port 5000 already in use?**
- Change port in app.py: `app.run(port=5001)`

**Import errors?**
- Reinstall dependencies: `pip install -r requirements.txt --force-reinstall`
