# 04 - API Reference

Base URL (local): `http://localhost:5000`

---

## Service and Health

### `GET /`

Returns service status and endpoint list.

### `GET /api/health`

Returns basic health response.

---

## Live Mining

### `POST /api/analyze`

Run live market basket analysis on CSV text.

Request body:

```json
{
  "csv_text": "InvoiceNo,Description,...",
  "algorithm": "fpgrowth",
  "min_support": 0.02,
  "min_confidence": 0.1,
  "min_lift": 1.0
}
```

Response (200) includes:

- `analysis` object (KPIs, rules, itemsets, charts data)
- `algorithm`
- `alert`

Validation response (400) includes:

- `error`
- `suitability`
- `alert`

Notes:

- Current implementation forces algorithm to FP-Growth inside endpoint logic.

---

## Recommendations and Rules

### `POST /api/recommendations`

Request:

```json
{
  "items": ["ITEM_A", "ITEM_B"],
  "algorithm": "apriori",
  "top_n": 5
}
```

Response:

```json
{
  "recommendations": [
    {
      "product": "ITEM_X",
      "confidence": 0.62,
      "lift": 1.84,
      "support": 0.03
    }
  ]
}
```

### `GET /api/rules`

Query params:

- `algorithm` (default `apriori`)
- `min_confidence` (default `0.3`)
- `top_n` (default `20`)

Response:

```json
{ "rules": [ ... ] }
```

---

## Segmentation and Prediction

### `POST /api/segments`

Request:

```json
{
  "purchase_count": 12,
  "avg_price": 2.6,
  "total_quantity": 40
}
```

Response:

```json
{
  "segment": 1,
  "characteristics": {
    "avg_purchases": 14.1,
    "avg_price": 2.2,
    "avg_quantity": 55.9
  }
}
```

### `POST /api/predict`

Request:

```json
{
  "products": ["ITEM_A", "ITEM_B"]
}
```

Response:

```json
{
  "will_buy_high_quantity": 0.74,
  "confidence": 0.82
}
```

---

## Analytics and Products

### `GET /api/analytics`

Returns dataset-level KPIs and top products.

### `GET /api/products`

Returns top available products list.

### `GET /api/products/<product_name>`

Returns product-level detail metrics.

### `POST /api/fbt`

Request:

```json
{
  "product": "ITEM_A",
  "top_n": 5
}
```

Response:

```json
{
  "frequently_bought_together": [ ... ]
}
```

### `GET /api/models`

Returns model artifact load status:

```json
{
  "apriori": true,
  "fpgrowth": true,
  "kmeans": false,
  "decision_tree": false
}
```
