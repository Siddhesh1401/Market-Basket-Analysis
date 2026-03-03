# Data Mining Addition — Market Basket Analysis Project

## Why Add a Data Mining Component?
The core Market Basket Analysis (Apriori/FP-Growth) is rule-based computation — not traditional
machine learning model training. To satisfy the "data mining" requirement of this project,
we add three additional data mining techniques that work on the same dataset and integrate
into the same website.

---

## Addition 1 — Customer Segmentation using K-Means Clustering

### What it is
K-Means is an unsupervised machine learning algorithm that groups customers into segments
based on their purchasing behavior. This is actual model training — the model learns cluster
centers from the data.

### What problem it solves
- Not all customers are the same
- Some buy frequently, some rarely
- Some spend a lot, some are budget buyers
- Segmentation lets businesses target each group differently

### How it works

#### Step 1 — Feature Engineering (from transaction data)
For each customer, calculate:
- **Frequency** = How many times did they purchase?
- **Monetary Value** = How much total money did they spend?
- **Avg Basket Size** = Average number of items per transaction
- **Recency** = How many days since their last purchase?

This is called RFM Analysis (Recency, Frequency, Monetary).

#### Step 2 — Normalize Features
```python
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(customer_features)
```

#### Step 3 — Find Optimal Number of Clusters (Elbow Method)
```python
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt

inertia = []
for k in range(1, 11):
    model = KMeans(n_clusters=k, random_state=42)
    model.fit(X_scaled)
    inertia.append(model.inertia_)

# Plot elbow curve — find where the curve bends
plt.plot(range(1, 11), inertia)
```

#### Step 4 — Train the Model
```python
kmeans = KMeans(n_clusters=3, random_state=42)
kmeans.fit(X_scaled)
labels = kmeans.predict(X_scaled)
```

#### Step 5 — Label the Segments
After clustering, interpret each group:
- **Cluster 0** → High-Value Customers (high frequency, high spend)
- **Cluster 1** → Occasional Buyers (medium frequency, medium spend)
- **Cluster 2** → Budget / Inactive Customers (low frequency, low spend)

#### Step 6 — Save model
```python
import pickle
pickle.dump(kmeans, open('kmeans_model.pkl', 'wb'))
pickle.dump(scaler, open('scaler.pkl', 'wb'))
```

### Visualizations
- **2D Scatter Plot** — PCA reduces features to 2D, each dot = 1 customer, colored by cluster
- **Bar Chart** — Average spend / frequency per cluster
- **Pie Chart** — What % of customers fall in each segment

### On the Website (Admin Dashboard — Segmentation Tab)
- Shows a 2D cluster plot
- Hover over a dot → see that customer's stats
- Segment summary table:
  | Segment | # Customers | Avg Spend | Avg Frequency |
  |---|---|---|---|
  | High-Value | 1,200 | £850 | 12 orders |
  | Occasional | 3,400 | £220 | 4 orders |
  | Budget | 1,800 | £65 | 1.5 orders |

---

## Addition 2 — Purchase Prediction using Classification

### What it is
A supervised machine learning model that predicts whether a customer will buy a specific product
in their next transaction based on their purchase history.

### What problem it solves
- Given what a customer has bought before, predict what they will buy next
- More powerful than pure association rules — uses past behavior as features
- Enables proactive recommendations before the customer even searches

### Algorithm Options
- **Decision Tree** — Easy to interpret, shows decision path
- **Naive Bayes** — Fast, works well with categorical/boolean features
- **Random Forest** — More accurate, ensemble of decision trees

### How it works

#### Step 1 — Build Feature Matrix
For each transaction, features = which items were bought (one-hot encoded)
Target = a specific high-value product bought or not (0 or 1)

Example: Predicting if customer will buy "Whole Milk"
```
Bread | Butter | Eggs | Cheese | ... → bought_milk (target)
  1       1       0       0    ...        1
  1       0       1       0    ...        0
  0       1       1       1    ...        1
```

#### Step 2 — Train/Test Split
```python
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```

#### Step 3 — Train the Model
```python
from sklearn.tree import DecisionTreeClassifier
model = DecisionTreeClassifier(max_depth=5, random_state=42)
model.fit(X_train, y_train)
```

#### Step 4 — Evaluate
```python
from sklearn.metrics import accuracy_score, classification_report
predictions = model.predict(X_test)
print(accuracy_score(y_test, predictions))
print(classification_report(y_test, predictions))
```

#### Step 5 — Save Model
```python
pickle.dump(model, open('classifier.pkl', 'wb'))
```

### Metrics Shown on Website
- Accuracy Score
- Precision / Recall / F1 Score
- Confusion Matrix (heatmap)
- Feature Importance Bar Chart (which products most predict the target)

### On the Website (Admin Dashboard — Prediction Tab)
- Dropdown to select "Target Product" (what you want to predict)
- Click "Train Classifier" → model trains, metrics appear
- Input form: check items bought → click "Predict" → shows probability

---

## Addition 3 — Frequent Pattern Mining with FP-Growth (vs Apriori comparison)

### What it is
FP-Growth (Frequent Pattern Growth) is a faster, more efficient alternative to Apriori.
It builds a compressed tree structure (FP-Tree) instead of scanning the dataset repeatedly.

### Why it's Data Mining
FP-Growth is a core data mining algorithm taught in data mining courses.
Adding it (alongside Apriori) demonstrates understanding of multiple mining techniques
and allows direct performance comparison.

### Key Difference from Apriori

| Feature | Apriori | FP-Growth |
|---|---|---|
| Dataset Scans | Multiple (2 per level) | Only 2 total |
| Memory Usage | High (candidate itemsets) | Low (FP-Tree) |
| Speed | Slower on large data | 10-100x faster |
| Implementation | mlxtend.frequent_patterns.apriori | mlxtend.frequent_patterns.fpgrowth |

### How it works
```python
from mlxtend.frequent_patterns import fpgrowth, association_rules

# Same basket matrix as Apriori
frequent_itemsets = fpgrowth(basket_df, min_support=0.01, use_colnames=True)
rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)
```

### On the Website (Admin Dashboard — Algorithm Comparison Tab)
- Side-by-side table: Apriori results vs FP-Growth results
- Performance comparison:
  | Metric | Apriori | FP-Growth |
  |---|---|---|
  | Rules Found | 847 | 847 |
  | Time Taken | 4.2 sec | 0.6 sec |
  | Memory Used | 145 MB | 38 MB |
- Bar chart comparing execution times

---

## How Data Mining Additions Integrate with the Main Website

```
Main Website (React + Flask)
│
├── Shop Page           → MBA recommendations (Apriori/FP-Growth rules)
├── Product Page        → "Frequently Bought Together" (MBA rules)
├── Cart Page           → Live recommendations (MBA rules)
│
└── Admin Dashboard
    ├── Rules Tab        → All association rules, charts
    ├── Segmentation Tab → K-Means customer clustering (Addition 1)
    ├── Prediction Tab   → Classification model — predict next purchase (Addition 2)
    └── Algorithm Tab    → Apriori vs FP-Growth comparison (Addition 3)
```

---

## Additional Flask API Endpoints for Data Mining

| Endpoint | Method | What it does |
|---|---|---|
| /api/segments | GET | Returns customer segments from K-Means |
| /api/train-kmeans | POST | Retrain K-Means on uploaded data |
| /api/predict | POST | Predict if customer will buy target product |
| /api/train-classifier | POST | Train Decision Tree classifier |
| /api/compare-algorithms | GET | Returns Apriori vs FP-Growth performance stats |

---

## Python Dependencies Added for Data Mining
```
scikit-learn      → KMeans, DecisionTreeClassifier, train_test_split, metrics
matplotlib        → Elbow curve, confusion matrix plots
seaborn           → Heatmaps
plotly            → Interactive scatter plots for clustering
```

---

## Summary of All Data Mining Techniques Used

| Technique | Type | Algorithm | Purpose |
|---|---|---|---|
| Association Rule Mining | Unsupervised | Apriori | Find product purchase patterns |
| Frequent Pattern Mining | Unsupervised | FP-Growth | Faster association rule mining |
| Customer Segmentation | Unsupervised | K-Means | Group customers by behavior |
| Purchase Prediction | Supervised | Decision Tree | Predict next product purchase |
| Dimensionality Reduction | — | PCA | Visualize clusters in 2D |
| Feature Analysis | — | RFM Analysis | Build meaningful customer features |
