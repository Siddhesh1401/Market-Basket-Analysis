# Website — Complete Guide
# Market Basket Analysis | Full-Stack E-Commerce + Analytics Platform

---

## Website Overview

This website has TWO panels:

```
┌─────────────────────────────────────────────────────┐
│                    WEBSITE                           │
│                                                      │
│   ┌─────────────────────┐  ┌─────────────────────┐  │
│   │    CUSTOMER PANEL   │  │    ADMIN PANEL      │  │
│   │  (Shopping Side)    │  │  (Analytics Side)   │  │
│   │                     │  │                     │  │
│   │  • Home             │  │  • Dashboard        │  │
│   │  • Shop             │  │  • Association Rules│  │
│   │  • Product Page     │  │  • Segmentation     │  │
│   │  • Cart             │  │  • Prediction       │  │
│   │  • Search           │  │  • Algorithm Compare│  │
│   └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

- **Customer Panel** — The fake e-commerce store (what a shopper sees)
- **Admin Panel** — The analytics and data mining dashboard (what a business owner sees)

Both panels share the same backend. The model trained in Admin Panel powers the recommendations in Customer Panel.

---

---

# PANEL 1 — CUSTOMER PANEL (Shopping Side)

---

## Page 1 — Home Page (Landing Page)

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  NAVBAR: [Logo]  [Home] [Shop] [Cart(0)] [Admin →]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│         SMART BASKET                                 │
│   "Shop smarter. We know what you need next."        │
│                                                      │
│         [ Browse Products ]  [ How it Works ]        │
│                                                      │
├──────────────────────────────────────────────────────┤
│  HOW IT WORKS — 3 steps                              │
│  [Add items]  →  [AI analyzes]  →  [Get suggestions] │
├──────────────────────────────────────────────────────┤
│  TOP SELLING PRODUCTS (6 product cards preview)      │
│  [Card][Card][Card][Card][Card][Card]                 │
│               [ View All Products ]                  │
└──────────────────────────────────────────────────────┘
```

### What it does
- Introduces the website with a hero section
- "Browse Products" button → takes user to Shop page
- "How it Works" button → scrolls down to a 3-step explanation section
- Shows 6 top-selling products as a preview
- Navbar is present on ALL pages

### How to use
- Open the website → this is the first thing you see
- Click "Browse Products" to start shopping
- Or click any product card to go directly to that product

---

## Page 2 — Shop Page (Product Listing)

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  NAVBAR                                              │
├──────────────────────────────────────────────────────┤
│  [ Search bar: "Search products..." ] [🔍]           │
│                                                      │
│  Filter by Category:                                 │
│  [All] [Food] [Beverages] [Household] [Snacks]       │
│                                                      │
│  Sort by: [Popularity ▼]  Showing 1-20 of 150        │
├──────────┬───────────────────────────────────────────┤
│          │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ SIDEBAR  │  │Image │ │Image │ │Image │ │Image │     │
│          │  │Bread │ │Milk  │ │Eggs  │ │Butter│     │
│ Filters: │  │£1.20 │ │£0.99 │ │£2.50 │ │£1.80 │     │
│ Price    │  │[Cart]│ │[Cart]│ │[Cart]│ │[Cart]│     │
│ Range    │  └──────┘ └──────┘ └──────┘ └──────┘     │
│          │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ □ Food   │  │Image │ │Image │ │Image │ │Image │     │
│ □ Drinks │  │ ...  │ │ ...  │ │ ...  │ │ ...  │     │
│ □ Home   │  └──────┘ └──────┘ └──────┘ └──────┘     │
└──────────┴───────────────────────────────────────────┘
```

### What it does
- Displays all products in a responsive grid
- Search bar filters products by name in real time (as you type)
- Category tabs filter by product type
- Sidebar has price range slider and category checkboxes
- Each product card shows: image, name, price, "Add to Cart" button
- Clicking the product image or name → goes to Product Detail page
- Clicking "Add to Cart" → adds item to cart, cart icon in navbar updates count

### How to use
1. Browse or search for a product
2. Use filters/categories to narrow down
3. Click a product to see its details
4. Click "Add to Cart" to add directly from the grid

---

## Page 3 — Product Detail Page

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  NAVBAR                                              │
├───────────────────────┬──────────────────────────────┤
│                       │  WHOLE MILK                  │
│   [Large Product      │  Category: Beverages         │
│    Image]             │  Price: £0.99                │
│                       │  Rating: ★★★★☆ (234 reviews) │
│                       │                              │
│                       │  Quantity: [-] 1 [+]         │
│                       │  [ Add to Cart ]             │
│                       │  [ Add to Wishlist ]         │
├───────────────────────┴──────────────────────────────┤
│  FREQUENTLY BOUGHT TOGETHER                          │
│  ┌──────────────────────────────────────────────┐    │
│  │  [Milk Image] + [Bread Image] + [Butter Image]│   │
│  │  Milk    +    Bread    +    Butter            │    │
│  │  £0.99       £1.20         £1.80              │    │
│  │  Total: £3.99         [ Add All 3 to Cart ]   │    │
│  └──────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────┤
│  CUSTOMERS WHO BOUGHT THIS ALSO BOUGHT               │
│  [Card] [Card] [Card] [Card] [Card]                  │
│  Eggs   Cheese  Yogurt  Jam   Bread                  │
│  72%    65%     58%     51%   48%  ← confidence %    │
├──────────────────────────────────────────────────────┤
│  YOU MIGHT ALSO LIKE (based on your browsing)        │
│  [Card] [Card] [Card] [Card]                         │
└──────────────────────────────────────────────────────┘
```

### What it does
- Shows full product details (image, price, description, rating)
- **"Frequently Bought Together"** — powered by association rules from the trained model
  - Shows the top 2 items that go with this product most often
  - "Add All 3 to Cart" button adds the bundle at once
- **"Customers Who Bought This Also Bought"** — top 5 association rule consequents
  - Confidence % shown under each item (how often they're bought together)
- Quantity selector before adding to cart

### How to use
1. Click any product from the Shop page
2. Review the product details
3. See what others buy with it in the "Frequently Bought Together" section
4. Click "Add All 3 to Cart" for the bundle deal
5. Or add individual items from "Customers Also Bought"

---

## Page 4 — Cart Page

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  NAVBAR                                              │
├────────────────────────────┬─────────────────────────┤
│  YOUR CART (3 items)       │  ORDER SUMMARY          │
│                            │                         │
│  ┌────────────────────┐    │  Subtotal:     £5.99    │
│  │[img] Bread  £1.20  │    │  Delivery:     £0.99    │
│  │      Qty: [-]1[+]  │    │  Total:        £6.98    │
│  │      [Remove]      │    │                         │
│  └────────────────────┘    │  [ Proceed to Checkout ]│
│  ┌────────────────────┐    │                         │
│  │[img] Milk   £0.99  │    └─────────────────────────┤
│  │      Qty: [-]1[+]  │                              │
│  │      [Remove]      │  DON'T FORGET THESE!         │
│  └────────────────────┘  ┌──────────────────────┐    │
│  ┌────────────────────┐  │ Based on your cart:  │    │
│  │[img] Butter £1.80  │  │ [Eggs] [Jam] [Cheese]│    │
│  │      Qty: [-]1[+]  │  │  82%    71%    65%   │    │
│  │      [Remove]      │  │  conf   conf   conf  │    │
│  └────────────────────┘  │  [+Add][+Add] [+Add] │    │
│                          └──────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### What it does
- Shows all items currently in the cart
- Quantity can be changed with +/- buttons → price updates live
- Remove button to delete an item
- Order summary on the right (subtotal, delivery, total)
- **"Don't Forget These!"** — This is the core recommendation box
  - Uses ALL items currently in cart as combined input to the model
  - Sends { "items": ["Bread", "Milk", "Butter"] } to the Flask API
  - Gets back top 3-5 recommendations not already in cart
  - Shows confidence % under each suggestion
  - "+Add" button instantly adds to cart
  - **Updates live every time cart changes** (new item added, item removed)

### How to use
1. Add items to cart from Shop or Product pages
2. The recommendation box automatically appears and updates
3. Review suggestions — click "+Add" to include them
4. Adjust quantities as needed
5. Click "Proceed to Checkout" (UI only, no actual payment)

---

## Page 5 — Search Results Page

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  NAVBAR                                              │
├──────────────────────────────────────────────────────┤
│  Results for: "milk"    (12 products found)          │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │Whole │ │Skimmed│ │Oat  │ │Almond│               │
│  │Milk  │ │Milk   │ │Milk │ │Milk  │               │
│  │£0.99 │ │£0.89  │ │£1.50│ │£1.99 │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
│  PEOPLE WHO SEARCHED "milk" ALSO SEARCHED FOR:      │
│  [ Bread ] [ Butter ] [ Cereal ] [ Eggs ]            │
└──────────────────────────────────────────────────────┘
```

### What it does
- Displays products matching the search term
- "People who searched X also searched for" — uses association rules on search behavior
- Click any product to go to its detail page

---

---

# PANEL 2 — ADMIN PANEL (Analytics & Data Mining Dashboard)

### How to Access
- Click "Admin" in the navbar → enters the Admin Panel
- No login required for the project (can add auth later)
- Completely separate layout from the Customer Panel

### Admin Panel Layout
```
┌──────────────────────────────────────────────────────┐
│  TOP BAR: [SmartBasket Admin]  [← Back to Store]     │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ SIDEBAR  │         MAIN CONTENT AREA                │
│          │                                           │
│ [📊 Dashboard]                                       │
│ [⚙️  Rules]                                          │
│ [👥 Segments]                                        │
│ [🎯 Prediction]                                      │
│ [⚡ Algorithm]                                       │
│ [📁 Data Upload]                                     │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

---

## Admin Page 1 — Dashboard (Overview)

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  STAT CARDS (top row)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │541,909   │ │4,070     │ │847       │ │38      │  │
│  │Transactions│ │Products │ │Rules     │ │Countries│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ TOP 10 PRODUCTS  │  │  MONTHLY TRANSACTIONS    │  │
│  │ (Horizontal bar  │  │  (Line chart over time)  │  │
│  │  chart)          │  │                          │  │
│  └──────────────────┘  └──────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ TOP 5 RULES      │  │  COUNTRY DISTRIBUTION    │  │
│  │ (Quick table)    │  │  (Pie chart)             │  │
│  └──────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### What it does
- Gives a bird's-eye view of the entire dataset and model
- 4 stat cards: total transactions, unique products, rules generated, countries
- Bar chart: top 10 most purchased products
- Line chart: transactions over time (month by month)
- Pie chart: which countries the orders come from
- Quick table: top 5 highest lift association rules found

### How to use
- This is the home page of the admin panel
- Refresh to see updated stats after retraining
- All charts are interactive (hover for values, click to filter)

---

## Admin Page 2 — Association Rules

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  CONTROLS                                            │
│  Min Support:    [====●===] 0.02                     │
│  Min Confidence: [===●====] 0.30                     │
│  Min Lift:       [==●=====] 1.5                      │
│  Algorithm: (●) Apriori  ( ) FP-Growth               │
│  [ Run Analysis ]   Rules Found: 847                 │
├──────────────────────────────────────────────────────┤
│  CHARTS ROW                                          │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │ HEATMAP     │ │ SCATTER PLOT │ │ NETWORK GRAPH │  │
│  │ (item co-   │ │ (support vs  │ │ (items=nodes, │  │
│  │  occurrence)│ │  confidence, │ │  rules=arrows)│  │
│  │             │ │  size=lift)  │ │               │  │
│  └─────────────┘ └──────────────┘ └───────────────┘  │
├──────────────────────────────────────────────────────┤
│  RULES TABLE                                         │
│  [Search rules...] [Download CSV ↓]                 │
│  ┌──────────────┬──────────────┬───────┬───────┬────┐│
│  │ Antecedents  │ Consequents  │Support│Confid.│Lift││
│  ├──────────────┼──────────────┼───────┼───────┼────┤│
│  │ Bread,Butter │ Milk         │ 0.05  │ 0.72  │2.4 ││
│  │ Eggs         │ Bacon        │ 0.03  │ 0.65  │3.1 ││
│  │ Cheese       │ Wine         │ 0.02  │ 0.58  │2.9 ││
│  └──────────────┴──────────────┴───────┴───────┴────┘│
│  Page: [1] 2 3 4 ... 85    Showing 1-10 of 847       │
└──────────────────────────────────────────────────────┘
```

### What it does
- **Controls Section:**
  - 3 sliders: adjust min support, confidence, lift thresholds
  - Algorithm toggle: Apriori or FP-Growth
  - "Run Analysis" button → sends request to Flask, reruns algorithm, updates everything
  - Live count of rules found updates after each run

- **Heatmap:** color grid showing how often any 2 products appear together; darker = more frequent

- **Scatter Plot:** each dot = 1 rule; X-axis = support, Y-axis = confidence, dot size = lift; hover over a dot to see what rule it is

- **Network Graph:** interactive graph; products are bubbles, arrows connect them based on rules; thicker/darker arrow = higher lift; zoom in/out, drag nodes around

- **Rules Table:**
  - Shows all generated rules with all 3 metrics
  - Click column header to sort (e.g., sort by lift DESC to find strongest rules)
  - Search bar filters rules by product name
  - "Download CSV" exports all rules to a spreadsheet

### How to use
1. Adjust sliders to set your thresholds
2. Click "Run Analysis"
3. View charts to understand patterns visually
4. Look at the table for specific rules
5. Sort by Lift to find the most interesting rules
6. Download CSV to save results

---

## Admin Page 3 — Customer Segmentation (K-Means)

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  Number of Clusters (K): [===●=] 3   [ Train Model ] │
│  Model Status: ● Trained  |  Last trained: Today     │
├──────────────────────────────────────────────────────┤
│  SEGMENT SUMMARY CARDS                               │
│  ┌───────────────┐ ┌───────────────┐ ┌────────────┐  │
│  │ HIGH-VALUE    │ │  OCCASIONAL   │ │  BUDGET    │  │
│  │ 1,200 customers│ │3,400 customers│ │1,800 cust. │  │
│  │ Avg: £850     │ │ Avg: £220     │ │ Avg: £65   │  │
│  │ 12 orders     │ │ 4 orders      │ │ 1.5 orders │  │
│  └───────────────┘ └───────────────┘ └────────────┘  │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐ ┌───────────────────┐   │
│  │  CLUSTER SCATTER PLOT   │ │  BAR CHART        │   │
│  │  (PCA 2D visualization) │ │  Avg spend per    │   │
│  │  Each dot = 1 customer  │ │  segment          │   │
│  │  Color = segment        │ │                   │   │
│  │  Hover = customer stats │ │                   │   │
│  └──────────────────────────┘ └───────────────────┘   │
├──────────────────────────────────────────────────────┤
│  ELBOW CURVE                                         │
│  (Graph showing optimal K — where the curve bends)   │
│  Used to justify choosing K=3                        │
└──────────────────────────────────────────────────────┘
```

### What it does
- Trains K-Means on customer RFM features (Recency, Frequency, Monetary value)
- Groups customers into K clusters (default 3)
- Labels each cluster as High-Value, Occasional, or Budget
- Shows summary stats for each segment (how many customers, avg spend, avg orders)
- 2D scatter plot shows all customers plotted, colored by their segment
- Elbow curve shows why K=3 is the right number of clusters
- Bar chart compares average spend across segments

### How to use
1. Choose number of clusters K using the slider
2. Click "Train Model"
3. Wait 3-5 seconds for training
4. View the cluster plot — each color group = 1 customer segment
5. Hover over dots to see individual customer stats
6. Use summary cards to understand each segment's behavior

---

## Admin Page 4 — Purchase Prediction

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  TARGET PRODUCT: [ Whole Milk ▼ ]                    │
│  Algorithm: (●) Decision Tree  ( ) Random Forest     │
│  [ Train Classifier ]                                │
├──────────────────────────────────────────────────────┤
│  MODEL METRICS                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │Accuracy  │ │Precision │ │ Recall   │ │F1 Score│  │
│  │  84.2%   │ │  81.7%   │ │  79.3%  │ │ 80.5% │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌────────────────────────┐    │
│  │ CONFUSION MATRIX │  │ FEATURE IMPORTANCE     │    │
│  │ (heatmap 2x2)    │  │ (top 10 products most  │    │
│  │                  │  │  predictive of target) │    │
│  │ Actual vs        │  │ (horizontal bar chart) │    │
│  │ Predicted        │  │                        │    │
│  └──────────────────┘  └────────────────────────┘    │
├──────────────────────────────────────────────────────┤
│  TRY THE PREDICTOR                                   │
│  Check items the customer has bought:                │
│  □ Bread  □ Butter  □ Eggs  □ Cheese  □ Jam ...      │
│                                                      │
│  [ Predict ]                                         │
│                                                      │
│  Result: Customer will buy Whole Milk                │
│  Probability: 78%  ████████░░  High likelihood       │
└──────────────────────────────────────────────────────┘
```

### What it does
- Select a target product (what you want to predict)
- Trains a Decision Tree or Random Forest classifier
- Uses other products as features (did customer buy Bread? Eggs? etc.)
- Shows accuracy, precision, recall, F1 score
- Confusion matrix shows true pos/neg vs false pos/neg
- Feature importance chart shows which products most strongly predict the target
- **"Try the Predictor"** — interactive demo:
  - Check boxes for what a customer has bought
  - Click "Predict"
  - Shows probability that customer will buy the target product

### How to use
1. Pick a target product from the dropdown (e.g., "Whole Milk")
2. Click "Train Classifier"
3. Review accuracy metrics and charts
4. Scroll to "Try the Predictor"
5. Tick checkboxes for products a customer has in their history
6. Click "Predict" → see probability result

---

## Admin Page 5 — Algorithm Comparison (Apriori vs FP-Growth)

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  [ Run Both Algorithms and Compare ]                 │
├──────────────────────────────────────────────────────┤
│  PERFORMANCE COMPARISON TABLE                        │
│  ┌─────────────────┬───────────┬───────────────────┐ │
│  │ Metric          │  Apriori  │    FP-Growth       │ │
│  ├─────────────────┼───────────┼───────────────────┤ │
│  │ Rules Found     │   847     │      847           │ │
│  │ Execution Time  │  4.2 sec  │     0.6 sec        │ │
│  │ Memory Used     │  145 MB   │     38 MB          │ │
│  │ Dataset Scans   │    12     │       2            │ │
│  └─────────────────┴───────────┴───────────────────┘ │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  TIME COMPARISON │  │  MEMORY COMPARISON       │   │
│  │  (Bar chart)     │  │  (Bar chart)             │   │
│  │  Apriori vs      │  │  Apriori vs FP-Growth    │   │
│  │  FP-Growth       │  │                          │   │
│  └──────────────────┘  └──────────────────────────┘   │
├──────────────────────────────────────────────────────┤
│  RULES OVERLAP CHECK                                 │
│  Rules only in Apriori: 0                            │
│  Rules only in FP-Growth: 0                          │
│  Rules in both: 847 (100% identical results)         │
│                                                      │
│  ✓ Both algorithms produce identical rules.          │
│    FP-Growth is 7x faster and uses 73% less memory.  │
└──────────────────────────────────────────────────────┘
```

### What it does
- Runs both Apriori and FP-Growth on the same dataset with same thresholds
- Compares: execution time, memory usage, number of rules, dataset scans
- Bar charts visualize the differences side by side
- Verifies that both algorithms produce the same rules (proving FP-Growth is just faster)
- States conclusion: FP-Growth wins on performance, identical results

### How to use
1. Click "Run Both Algorithms and Compare"
2. Wait for both to finish (~5 seconds)
3. Review the comparison table and charts
4. Read the conclusion at the bottom

---

## Admin Page 6 — Data Upload & Retrain

### What it looks like
```
┌──────────────────────────────────────────────────────┐
│  CURRENT DATASET                                     │
│  File: retail.csv  |  Size: 45.6 MB  |  Rows: 541,909│
│  Last trained: March 1, 2026 10:30 AM                │
├──────────────────────────────────────────────────────┤
│  UPLOAD NEW DATASET                                  │
│  ┌────────────────────────────────────────────┐     │
│  │                                            │     │
│  │   Drag & Drop CSV file here                │     │
│  │   or                                       │     │
│  │   [ Browse Files ]                         │     │
│  │                                            │     │
│  │   Required columns:                        │     │
│  │   InvoiceNo, Description, Quantity         │     │
│  └────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────┤
│  RETRAIN SETTINGS                                    │
│  Min Support:    [====●===] 0.01                     │
│  Min Confidence: [===●====] 0.20                     │
│  Min Lift:       [==●=====] 1.0                      │
│  Algorithm: (●) FP-Growth  ( ) Apriori               │
│                                                      │
│  [ Retrain Model ]                                   │
│                                                      │
│  Training Progress:                                  │
│  [████████████░░░░░░░░] 65%  Processing rules...     │
└──────────────────────────────────────────────────────┘
```

### What it does
- Shows current dataset info (filename, size, rows, last trained date)
- Drag and drop or browse to upload a new CSV file
- Shows required column format for the CSV
- Set thresholds for retraining
- "Retrain Model" button → triggers full pipeline:
  1. Preprocesses the new CSV
  2. Runs FP-Growth (or Apriori)
  3. Generates new rules
  4. Saves new rules.pkl
  5. Flask automatically uses new rules for recommendations
- Progress bar shows training status in real time

### How to use
1. Prepare a CSV file with columns: InvoiceNo, Description, Quantity
2. Drag and drop it into the upload box
3. Set thresholds
4. Click "Retrain Model"
5. Wait for progress bar to complete
6. All recommendations on the Customer Panel now use new rules

---

---

# Full Website Navigation Map

```
                    [ HOME PAGE ]
                         |
            ┌────────────┴────────────┐
            ▼                         ▼
       [ SHOP PAGE ]           [ ADMIN PANEL ]
            |                         |
  ┌─────────┼──────────┐    ┌─────────┼──────────────┐
  ▼         ▼          ▼    ▼         ▼              ▼
[Product  [Search   [Cart] [Dashboard] [Rules]   [Segments]
 Detail]  Results]    |         |          |          |
  |                   |    [Prediction] [Algorithm] [Upload]
  └───────────────────┘
         (Add to Cart flows between all shopping pages)
```

---

# How a Typical User Uses This Website

### Customer Flow (5 minutes)
1. Open website → see Home page
2. Click "Browse Products" → Shop page
3. Search for "Milk" → find Whole Milk
4. Click on it → Product Detail page
5. See "Frequently Bought Together" → Bread + Butter with Milk
6. Click "Add All 3 to Cart"
7. Go to Cart → see "Don't Forget: Eggs, Cheese, Jam" recommendations
8. Add Eggs to cart
9. Proceed to Checkout

### Admin Flow (Demo / Presentation)
1. Click "Admin" in navbar
2. Dashboard → show dataset stats and top products chart
3. Association Rules → move sliders, click Run, show heatmap and network graph
4. Download CSV of rules
5. Segmentation → click Train Model, show cluster plot with 3 colored groups
6. Prediction → pick "Whole Milk", train, show 84% accuracy, demo predictor tool
7. Algorithm Comparison → run both, show FP-Growth is 7x faster
8. Upload → show how new data can be fed in and model retrained

---

# Technical Summary

| Feature | Technology |
|---|---|
| Frontend framework | React.js |
| Styling | CSS + custom components |
| Routing | React Router DOM |
| API calls | Axios |
| Charts (frontend) | Recharts / Plotly.js |
| Backend | Python Flask |
| Data processing | pandas, numpy |
| Association rules | mlxtend (Apriori + FP-Growth) |
| Clustering | scikit-learn KMeans |
| Classification | scikit-learn DecisionTreeClassifier |
| Model storage | pickle (.pkl files) |
| Network graph | NetworkX + D3.js or Pyvis |
