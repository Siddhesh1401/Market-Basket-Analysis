# 03 — Frontend Architecture

## Overview

The frontend is a **React 18 + TypeScript** single-page application (SPA) built with **Vite**. All pages render client-side. When the Flask backend is connected, data will be fetched via **Axios** API calls.

---

## Entry Points

### `index.html`
The single HTML file Vite serves. Contains `<div id="root">` where React mounts.

### `src/main.tsx`
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### `src/App.tsx`
Root component. Wraps everything in `CartProvider` and defines all routes.

---

## Routing (react-router-dom v7)

All 11 routes are defined in `App.tsx`:

| Path | Component | Panel |
|------|-----------|-------|
| `/` | `Home` | Customer |
| `/shop` | `Shop` | Customer |
| `/product/:id` | `ProductDetail` | Customer |
| `/cart` | `Cart` | Customer |
| `/search` | `SearchResults` | Customer |
| `/admin` | `AdminLayout` → `Dashboard` | Admin |
| `/admin/rules` | `AdminLayout` → `Rules` | Admin |
| `/admin/segmentation` | `AdminLayout` → `Segmentation` | Admin |
| `/admin/prediction` | `AdminLayout` → `Prediction` | Admin |
| `/admin/algorithm` | `AdminLayout` → `AlgorithmCompare` | Admin |
| `/admin/upload` | `AdminLayout` → `DataUpload` | Admin |

Admin routes are **nested** under `AdminLayout` using React Router's `<Outlet>`. This means AdminLayout renders the sidebar, and the child page renders inside it.

```tsx
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<Dashboard />} />
  <Route path="rules" element={<Rules />} />
  ...
</Route>
```

---

## State Management

### CartContext (`src/context/CartContext.tsx`)

Global shopping cart state shared across all components using React's Context API.

**Interface:**
```typescript
interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}
```

**Exposed values & functions:**
| Name | Type | Description |
|------|------|-------------|
| `cartItems` | `CartItem[]` | All items currently in cart |
| `addToCart` | `(product) => void` | Add item or increment quantity |
| `removeFromCart` | `(id) => void` | Remove item completely |
| `updateQuantity` | `(id, qty) => void` | Set specific quantity |
| `cartCount` | `number` | Total item count (for badge) |
| `cartTotal` | `number` | Total price in £ |

**Usage in any component:**
```tsx
const { cartItems, addToCart, cartCount } = useCart();
```

---

## Mock Product Data (`src/data/products.ts`)

20 products used across all pages. Each product has:

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;        // Unsplash URL
  category: string;     // "Food" | "Beverages" | "Snacks" | "Household"
  rating: number;       // 4.0 - 5.0
  reviews: number;
  description: string;
}
```

**Categories**: All, Food, Beverages, Snacks, Household

---

## Component Architecture

```
App.tsx (CartProvider + Router)
│
├── Navbar.tsx          ← shown on ALL pages
│
├── Customer Pages
│   ├── Home.tsx
│   ├── Shop.tsx
│   ├── ProductDetail.tsx
│   ├── Cart.tsx
│   └── SearchResults.tsx
│
└── Admin Pages
    └── AdminLayout.tsx (sidebar wrapper)
        ├── Dashboard.tsx
        ├── Rules.tsx
        ├── Segmentation.tsx
        ├── Prediction.tsx
        ├── AlgorithmCompare.tsx
        └── DataUpload.tsx
```

---

## Navbar (`src/components/Navbar.tsx`)

Renders on every page. Adapts based on route:

- **Customer mode**: Logo, search bar, cart icon with badge, admin link
- **Admin mode**: Hides the search bar (admin has its own controls)

**How the cart badge works:**
```tsx
const { cartCount } = useCart();
// Renders:
<span className="cart-badge">{cartCount}</span>
```

**How search navigates:**
```tsx
const navigate = useNavigate();
// On search submit:
navigate(`/search?q=${query}`);
```

---

## Charts Library (Recharts)

Used in Dashboard, Rules, Segmentation, Prediction, AlgorithmCompare.

**Recharts components used:**
| Component | Used For |
|-----------|----------|
| `BarChart` / `Bar` | Top products, algo comparison, segment spend |
| `LineChart` / `Line` | Monthly transactions |
| `PieChart` / `Pie` | Country distribution, cluster distribution |
| `ScatterChart` / `Scatter` | Rules (support vs confidence), customer clusters |
| `ResponsiveContainer` | Makes all charts fluid/responsive |
| `Tooltip` | Hover values |
| `CartesianGrid` | Background grid lines |
| `XAxis` / `YAxis` | Axes labels |

---

## Key Design Patterns Used

### 1. useMemo for filtering
Shop.tsx uses `useMemo` to avoid re-computing the filtered/sorted product list on every render:
```tsx
const filtered = useMemo(() => {
  return products
    .filter(p => p.name.includes(search))
    .filter(p => p.price <= maxPrice)
    ...
}, [search, category, sort, maxPrice]);
```

### 2. Association Rules as a lookup map
```tsx
const associationRules: Record<number, number[]> = {
  1: [3, 7, 12],
  2: [5, 9, 14],
  ...
};
```
`ProductDetail.tsx` directly indexes this map with the current `productId`.  
`Cart.tsx` scores ALL rules by counting overlaps with cart items to rank recommendations.

### 3. Drag and Drop (no library)
`DataUpload.tsx` implements drag-and-drop using only native browser events:
```tsx
onDragOver={e => { e.preventDefault(); setDragging(true); }}
onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
```

### 4. Animated progress bar
`DataUpload.tsx` uses `setTimeout` steps to simulate training progress:
```tsx
const steps = [10, 20, 35, 50, 65, 78, 90, 100];
steps.forEach((pct, i) => {
  setTimeout(() => setProgress(pct), i * 600);
});
```

### 5. CSV Download
`Rules.tsx` generates a downloadable CSV from filtered rules using a Blob:
```tsx
const blob = new Blob([csv], { type: "text/csv" });
const url = URL.createObjectURL(blob);
```
