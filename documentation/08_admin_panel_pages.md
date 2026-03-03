# 05 — Admin Panel Pages

## Overview

The Admin Panel is for the project owner / demo presentation. It visualises all data mining results and provides tools to manage the model. All 6 pages are inside `/admin/...` routes.

**Access**: Click "Admin" in the Navbar, or go directly to `http://localhost:5173/admin`

---

## Layout: AdminLayout (`/admin/*`)

**File**: `src/pages/admin/AdminLayout.tsx`

A persistent sidebar + main content wrapper. Uses React Router's `<Outlet>` so the child page renders in the content area while the sidebar stays fixed.

### Sidebar Navigation Links
| Icon | Label | Route |
|------|-------|-------|
| MdDashboard | Overview | `/admin` |
| MdOutlineRule | Association Rules | `/admin/rules` |
| MdPeople | Segmentation | `/admin/segmentation` |
| MdModelTraining | Prediction | `/admin/prediction` |
| MdCompare | Algorithm Compare | `/admin/algorithm` |
| MdUpload | Data Upload | `/admin/upload` |

Active link is highlighted in primary blue. Uses `NavLink` from react-router-dom which automatically adds `active` class.

---

## Admin Page 1: Dashboard (`/admin`)

**File**: `src/pages/admin/Dashboard.tsx` — 147 lines

### Purpose
High-level overview of the entire dataset and model results at a glance.

### Stat Cards (top row)
| Card | Value | Icon |
|------|-------|------|
| Total Transactions | 541,909 | 📦 |
| Unique Products | 4,070 | 🏷️ |
| Association Rules | 847 | 🔗 |
| Countries | 38 | 🌍 |

### Charts
1. **Bar Chart — Top 10 Products by Sales Volume**: Horizontal bar chart. Shows Whole Milk (2,502), Other Vegetables (1,898), Rolls/Buns (1,716), etc.
2. **Line Chart — Monthly Transactions**: Shows transaction volume trend across 12 months (Jan–Dec).
3. **Pie Chart — Orders by Country**: Distribution across UK, Germany, France, EIRE, Spain regions.
4. **Top 5 Rules Table**: A mini table showing the 5 rules with highest lift. Columns: Antecedent → Consequent, Support, Confidence, Lift.

### Implementation Notes
- All charts use `ResponsiveContainer` for fluid sizing
- Chart data is hardcoded mock data that mirrors the actual retail dataset distributions
- When backend connects, this will call `/api/stats`

---

## Admin Page 2: Association Rules (`/admin/rules`)

**File**: `src/pages/admin/Rules.tsx`

### Purpose
Explore and filter all mined association rules interactively.

### Control Panel (top section)
Three sliders to filter rules:
- **Min Support** (0.001 – 0.05): Only show rules where support ≥ this value
- **Min Confidence** (0.1 – 0.9): Only show rules where confidence ≥ this value
- **Min Lift** (1.0 – 5.0): Only show rules where lift ≥ this value

**Algorithm Toggle**: Switch between `Apriori` and `FP-Growth` (both produce same rules, toggle is for demonstration)

**Rules Found badge**: Updates in real-time as sliders change, shows filtered count.

### Charts Section (3-column grid)
1. **Scatter Plot — Support vs Confidence (bubble size = lift)**:
   - X-axis: Support value
   - Y-axis: Confidence value
   - Each dot = one rule, bigger dot = higher lift
   - Helps visualise the distribution of rules

2. **Co-occurrence Heatmap**:
   - 8×8 grid of product pairs
   - Color intensity = how often they appear together
   - Built manually (no Recharts — pure CSS grid with `background` set per cell)
   - Darker blue = higher co-occurrence

3. **Top 5 Rules by Lift**:
   - Ranked list with rank badge
   - Shows rule text and lift value

### Sortable Rules Table (bottom)
Full table of all filtered rules. Columns:
- Antecedent (products that trigger the rule) — shown as blue pill badge
- Consequent (recommended product) — shown as orange pill badge  
- Support (with mini bar)
- Confidence (with mini bar)
- Lift — shown as green badge
- Click any column header to sort ascending/descending

### CSV Download
Blue download button exports all currently-filtered rules as a `.csv` file via browser Blob API. No server needed.

---

## Admin Page 3: Customer Segmentation (`/admin/segmentation`)

**File**: `src/pages/admin/Segmentation.tsx`

### Purpose
Visualize K-Means customer clustering results.

### Controls
- **K Slider** (2–8): Choose number of clusters
- **Train Model button**: Simulates training with 2-second delay, then shows results
- **Model status indicator**: Shows "Model not trained" (yellow) or "Trained with K=X" (green)

### Segment Summary Cards (3-column grid)
One card per cluster after training. Each card shows:
- Segment name (High-Value / Occasional / Budget)
- Customer count
- Color-coded top border (matching cluster color on scatter plot)
- Average Spend in £
- Average Orders per month

### Charts (2-column grid)
1. **Customer Clusters Scatter Plot (PCA 2D)**:
   - 150 data points, each colored by their assigned cluster
   - Uses `CustomDot` component for colored dots
   - Legend below showing cluster colors
   - Subtitle: "Each dot = 1 customer, coloured by segment"

2. **Cluster Analysis Charts (2 sub-charts)**:
   - Bar chart: Average spend by segment
   - Pie chart: Customer distribution (% in each segment)
   - Line chart: Elbow curve (inertia vs K), with K=3 highlighted in blue

---

## Admin Page 4: Purchase Prediction (`/admin/prediction`)

**File**: `src/pages/admin/Prediction.tsx`

### Purpose
Train and evaluate a Decision Tree classifier. Also includes an interactive prediction demo.

### Controls
- **Target Product dropdown**: Select which product to predict (all 20 products available)
- **Classifier toggle**: Decision Tree or Random Forest
- **Train button**: Simulates training with 1.5-second delay
- **Status indicator**: Shows which product the model was trained on

### Metrics Cards (4-column grid, shown after training)
| Card | Value | Visual |
|------|-------|--------|
| Accuracy | 84.2% | Progress bar |
| Precision | 81.7% | Progress bar |
| Recall | 79.3% | Progress bar |
| F1 Score | 80.5% | Progress bar |

### Charts (2 columns)
1. **Confusion Matrix** (2×2 grid):
   - True Positive (847): Green cell
   - False Negative (203): Red cell
   - False Positive (187): Red cell
   - True Negative (1,763): Green cell

2. **Feature Importance** (horizontal bar chart):
   - Shows which product features most influence the prediction
   - Features: Whole Milk (82%), Other Vegetables (74%), Rolls/Buns (68%), Soda (55%), Yogurt (47%)

### Interactive Predictor Demo
- Product image checkboxes: "Check the products in the customer's cart"
- Click images to toggle selection
- "Predict" button runs the prediction
- Result shows: "Will Buy" (green) or "Will Skip" (red) + probability bar
- Example: "92% probability of buying Whole Milk"

---

## Admin Page 5: Algorithm Compare (`/admin/algorithm`)

**File**: `src/pages/admin/AlgorithmCompare.tsx`

### Purpose
Side-by-side benchmark of Apriori vs FP-Growth on the same dataset.

### Run Comparison Button
Simulates running both algorithms with a 2-second animation, then reveals results.

### Comparison Table
| Metric | Apriori 🔵 | FP-Growth 🟢 | Winner |
|--------|-----------|------------|--------|
| Rules Found | 847 | 847 | Tie (identical) 🟡 |
| Execution Time | 4.2 sec | 0.6 sec | FP-Growth 🏆 |
| Memory Usage | 145 MB | 38 MB | FP-Growth 🏆 |
| Database Scans | 12 | 2 | FP-Growth 🏆 |
| Rule Overlap | 100% | 100% | Tie (identical) 🟡 |

### Bar Charts (2 columns)
1. Time comparison (Apriori: 4.2s vs FP-Growth: 0.6s)
2. Memory comparison (Apriori: 145MB vs FP-Growth: 38MB)

### Conclusion Card (green)
> "FP-Growth is 7× faster and uses 73% less memory while producing identical rules. FP-Growth is the clear choice for production systems."

---

## Admin Page 6: Data Upload & Retrain (`/admin/upload`)

**File**: `src/pages/admin/DataUpload.tsx`

### Purpose
Upload a new CSV dataset and trigger model retraining (when backend is connected).

### Current Dataset Info Card
Shows stats about the currently loaded dataset:
- File: retail.csv
- Size: 45.6 MB
- Rows: 541,909
- Products: 4,070 unique
- Last Trained: March 3, 2026

### Upload Zone
Drag-and-drop area with:
- Dashed border that glows blue on hover/drag
- Upload icon + "Drag & drop your CSV here" text
- "browse" link (hidden file input, triggered by click)
- Accepts `.csv` files only
- Once file is selected: shows file name, size, and clear (×) button

### Training Progress (shown after clicking "Upload & Retrain")
Animated 8-step progress bar:
- 10%: Reading CSV...
- 20%: Preprocessing data...
- 35%: Building transaction matrix...
- 50%: Running FP-Growth...
- 65%: Generating association rules...
- 78%: Training K-Means clustering...
- 90%: Training Decision Tree...
- 100%: All models saved!

### Success Message (shown at 100%)
Green card: "✅ Training complete! 847 rules found. Models saved to backend."

### Retrain Settings (below upload)
Configurable parameters:
- Min Support slider
- Min Confidence slider
- K value for clustering
- Max tree depth for Decision Tree
