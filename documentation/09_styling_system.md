# 06 — Styling System

## Overview

The entire app is styled with a single file: **`src/index.css`** (~1,300+ lines). No external UI frameworks (no Bootstrap, no Tailwind, no MUI). Everything is hand-crafted custom CSS.

---

## CSS Custom Properties (Variables)

Defined in `:root` at the top of `index.css`. These variables are used everywhere so changing them cascades the entire app.

```css
:root {
  /* Brand Colors */
  --primary: #2563eb;          /* Main blue — buttons, links, highlights */
  --primary-soft: #eff6ff;     /* Light blue bg for selected states */
  --primary-dark: #1d4ed8;     /* Hover state for buttons */

  /* Semantic Colors */
  --success: #16a34a;          /* Green — in cart, trained, positive */
  --accent: #f59e0b;           /* Yellow/amber — ratings, recommendation box */

  /* Backgrounds */
  --bg: #f8fafc;               /* Main page background */
  --bg-white: #ffffff;         /* Cards, inputs */

  /* Text */
  --text-primary: #0f172a;     /* Headings, important text */
  --text-secondary: #475569;   /* Body text */
  --text-muted: #94a3b8;       /* Labels, hints */

  /* Borders */
  --border: #e2e8f0;           /* Card borders, dividers */

  /* Border Radius */
  --radius-sm: 8px;            /* Buttons, inputs, small elements */
  --radius-md: 12px;           /* Cards, panels */
  --radius-lg: 16px;           /* Large cards, upload zones */
}
```

---

## CSS File Structure (by section)

| Section | Lines (approx) | What it covers |
|---------|----------------|----------------|
| Global Reset | 1–40 | box-sizing, body, scrollbar, selection color |
| CSS Variables | 40–70 | :root color/spacing tokens |
| Utility Classes | 70–110 | .btn, .btn-primary, .btn-secondary, .btn-outline, .loading |
| Navbar | 110–180 | .navbar, .nav-logo, .navbar-search, .cart-badge |
| Home Page | 180–380 | .hero, .hero-visual, .floating-cards, .how-it-works, .features-banner |
| Admin Layout | 380–450 | .admin-layout, .admin-sidebar, .admin-main, NavLink active states |
| Admin Dashboard | 450–510 | .dashboard-stats, .stat-card, .charts-grid |
| Shop Page | 510–660 | .shop-layout, .shop-sidebar, .shop-grid, .product-card, .in-cart-badge |
| Product Detail | 660–810 | .pd-layout, .pd-image-wrap, .fbt-section, .also-bought, .confidence-bar |
| Cart Page | 810–900 | .cart-layout, .cart-items, .cart-rec-box, .order-summary, .empty-cart |
| Admin Pages Base | 900–960 | .admin-page, .admin-page-header, .chart-card, .charts-row-2/3, .sort-select |
| Rules Page | 960–1060 | .rules-controls, .heatmap-wrap, .rules-table, .ant-tag, .con-tag, .lift-badge |
| Segmentation Page | 1060–1120 | .train-control-card, .model-status, .segment-cards, .seg-stats, .cluster-legend |
| Prediction Page | 1120–1230 | .metrics-cards, .conf-matrix, .feature-list, .predictor-grid, .predict-result |
| Algorithm Compare | 1230–1280 | .compare-table, .winner-badge, .tie-badge, .conclusion-card |
| Data Upload | 1280–1360 | .upload-zone, .progress-track, .train-success, .dataset-info-card |
| Responsive | 1360+ | @media (max-width: 768px) for all sections |

---

## Button System

All interactive buttons use the `.btn` base plus a modifier class:

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 20px; border-radius: var(--radius-sm);
  font-weight: 600; font-size: 0.92rem; cursor: pointer;
  border: none; transition: all 0.2s;
}
.btn-primary  { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); }
.btn-secondary { background: var(--bg); border: 1.5px solid var(--border); }
.btn-outline { background: transparent; border: 1.5px solid var(--primary); color: var(--primary); }
.btn.loading { opacity: 0.7; cursor: not-allowed; }
```

---

## Card Pattern

Most sections use a consistent card style:
```css
.chart-card {
  background: var(--bg-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}
```

---

## Responsive Design

One media query at the bottom handles all responsive breakpoints at `max-width: 768px`:

```css
@media (max-width: 768px) {
  .hero { flex-direction: column; text-align: center; }
  .hero-visual { display: none; }
  .navbar-search { display: none; }
  .admin-sidebar { display: none; }
  .admin-main { padding: 16px; }
  .shop-sidebar { display: none; }
  .shop-body { flex-direction: column; }
  .charts-row-2 { grid-template-columns: 1fr; }
  .charts-row-3 { grid-template-columns: 1fr; }
  .segment-cards { grid-template-columns: 1fr; }
  .metrics-cards { grid-template-columns: repeat(2, 1fr); }
  .cart-layout { grid-template-columns: 1fr; }
  .pd-main { grid-template-columns: 1fr; }
  .admin-page { padding: 16px; }
}
```

---

## Special Visual Effects

### Hero Floating Cards
```css
.floating-cards {
  position: relative;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
```

### Button Hover Lift
```css
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37,99,235,0.3);
}
```

### Product Card Hover
```css
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
```

### Confidence Bar Animation
```css
.confidence-fill {
  width: 0;
  animation: fillBar 0.8s ease-out forwards;
}
@keyframes fillBar {
  to { width: var(--target-width); }
}
```

---

## Color Usage Reference

| Color | Used For |
|-------|---------|
| `#2563eb` (blue) | Buttons, links, active states, chart bars |
| `#16a34a` (green) | Success states, trained badges, "In Cart", TP cells |
| `#f59e0b` (amber) | Cart recommendation box, star ratings |
| `#ef4444` (red) | Error cells in confusion matrix, remove buttons |
| `#1a56db` (dark blue) | Antecedent (rule "if") pills |
| `#b45309` (brown) | Consequent (rule "then") pills |
| `#15803d` (dark green) | Lift badges, winner badges, conclusion cards |
