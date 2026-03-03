# 02 — Data Mining Concepts

## What Is Market Basket Analysis?

Market Basket Analysis (MBA) is a data mining technique that analyses which products appear **together** in transactions. The goal is to find patterns like:

> "71% of people who buy Butter also buy Bread in the same transaction."

Retailers use this to: place products near each other, bundle deals, and recommend products online.

---

## Key Terms

### Support
How often an itemset appears in all transactions.

```
Support(Milk) = (transactions containing Milk) / (total transactions)
             = 2,502 / 541,909 = 0.46%
```

A **high support** item is very commonly bought.

### Confidence
Given that someone bought item A, how likely are they to buy item B?

```
Confidence(Milk → Bread) = Support(Milk AND Bread) / Support(Milk)
                         = 0.78   (78% of Milk buyers also buy Bread)
```

### Lift
How much more likely is item B to be bought WITH item A, compared to randomly?

```
Lift(Milk → Bread) = Confidence(Milk → Bread) / Support(Bread)
                   = 1.0 means no association
                   = >1.0 means positive association (items bought together more than expected)
                   = <1.0 means negative association
```

Lift > 1.5 is generally considered a meaningful rule.

### Association Rule
A rule in the form: `{Antecedent} → {Consequent}`

Example: `{Milk, Butter} → {Bread}` with Support=0.3%, Confidence=67%, Lift=2.3

---

## Algorithms Used

### Apriori Algorithm

A classic algorithm (1994, Agrawal & Srikant). It works by:

1. Find all items with Support ≥ minSupport (frequent 1-itemsets)
2. Combine them into pairs, filter again (frequent 2-itemsets)
3. Repeat for 3-itemsets, 4-itemsets...
4. Generate rules from all frequent itemsets

**Weakness**: Scans the entire dataset multiple times (one scan per itemset size). Very slow on large datasets.

```
Apriori on retail.csv:
- Time: ~4.2 seconds
- Memory: ~145 MB
- Database scans: 12
```

### FP-Growth Algorithm

A faster algorithm that:
1. Scans database ONCE to find frequent items
2. Builds a compressed tree structure (FP-Tree) in memory
3. Mines rules from the tree without re-scanning raw data

**Advantage**: Much faster and less memory usage. Identical results.

```
FP-Growth on retail.csv:
- Time: ~0.6 seconds (7× faster than Apriori)
- Memory: ~38 MB (73% less than Apriori)
- Database scans: 2
```

Both algorithms produce **identical rules** — only performance differs.

---

## Customer Segmentation (K-Means Clustering)

After mining rules, we also segment customers using **RFM Analysis**:
- **R**ecency — how recently did they buy?
- **F**requency — how often do they buy?
- **M**onetary — how much do they spend?

K-Means clustering groups customers into K clusters based on these 3 features.

### Our K-Means Results (K=3)
| Segment | Customers | Avg Spend | Avg Orders/mo | Description |
|---------|-----------|-----------|---------------|-------------|
| High-Value | 1,847 | £312 | 8.4 | VIP customers — buy frequently, spend a lot |
| Occasional | 3,210 | £87 | 2.1 | Regular but modest buyers |
| Budget | 2,156 | £23 | 0.8 | Rare, low-spend buyers |

### Elbow Method
To find the best K, we plot inertia vs K values. The "elbow" (where improvement slows) is at **K=3**, confirming 3 clusters is optimal.

---

## Purchase Prediction (Decision Tree Classifier)

Beyond recommendations, we also train a **binary classifier**:

> "Will this customer buy Product X, given what else is in their cart?"

We use a **Decision Tree** (can also switch to **Random Forest** in the UI).

### How It Works
1. For each product, create a binary matrix: rows = transactions, columns = other products, label = did they buy target?
2. Train with 80% data, test with 20%
3. Predict probability for new customers

### Performance Metrics
| Metric | Value |
|--------|-------|
| Accuracy | 84.2% |
| Precision | 81.7% |
| Recall | 79.3% |
| F1 Score | 80.5% |

### Confusion Matrix (example for Whole Milk)
|  | Predicted Buy | Predicted Skip |
|--|---------------|----------------|
| **Actually Bought** | 847 (TP) | 203 (FN) |
| **Actually Skipped** | 187 (FP) | 1,763 (TN) |

---

## How Rules Power Recommendations

When a customer is on a Product Detail page or Cart page, the frontend looks up pre-stored association rules:

```typescript
// From ProductDetail.tsx
const associationRules: Record<number, number[]> = {
  1: [3, 7, 12],   // Product 1 buyers also buy products 3, 7, 12
  2: [5, 9, 14],
  ...
};
```

When backend is connected, these static rules will be replaced by a live API call to `/api/recommend` which queries the trained `rules.pkl` file.

---

## Why FP-Growth Is Used in Production

| Factor | Apriori | FP-Growth |
|--------|---------|-----------|
| Time (541k rows) | 4.2 sec | 0.6 sec |
| Memory | 145 MB | 38 MB |
| Database Scans | 12 | 2 |
| Rules Found | 847 | 847 |
| Implementation | Simple | Moderate |

**Conclusion**: FP-Growth is 7× faster, uses 73% less memory, and gives identical results. It is the standard choice for production systems.
