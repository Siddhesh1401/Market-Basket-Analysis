# 04 — Customer Panel Pages

## Overview

The Customer Panel is the shopping-facing side of the app. It has 5 pages. All pages share the Navbar and use CartContext for cart state.

---

## Page 1: Home (`/`)

**File**: `src/pages/Home.tsx` — 154 lines

### Purpose
Landing page. First thing visitors see. Explains the project and shows top products.

### Sections

#### Hero Section
- Big headline: "Smart Shopping, Powered by Data"
- Subtitle explaining the MBA recommendation system
- 3 stats: 541K+ Transactions, 4,070 Products, 847+ Rules Mined
- Two buttons: "Start Shopping" (→ /shop) and "Admin Dashboard" (→ /admin)
- Floating product cards on the right (animated with CSS)

#### How It Works (3 steps)
1. Browse products
2. Algorithm mines patterns from 541k transactions
3. System suggests what others bought

#### Top Products Grid
Shows the first 6 products from `products.ts`. Each has an "Add to Cart" button that calls `addToCart()` from CartContext.

#### Features Banner
3 feature highlights at the bottom showing the data science capabilities.

### Key Implementation
```tsx
const topProducts = products.slice(0, 6);
const { addToCart } = useCart();
```

---

## Page 2: Shop (`/shop`)

**File**: `src/pages/Shop.tsx`

### Purpose
Full product listing with search, filter, and sort abilities — like a real e-commerce category page.

### Features

#### Search Bar
- Controlled input, real-time filtering
- "Clear" (×) button when search has text

#### Category Tabs
- "All", "Food", "Beverages", "Snacks", "Household"
- Active tab highlighted in primary blue

#### Sidebar Filters
- **Price Range Slider**: 0 – £50, updates `maxPrice` state
- **Category checkboxes**: Alternative to tabs

#### Sort Dropdown
- Alphabetical A→Z
- Price: Low to High
- Price: High to Low
- Rating: High to Low

#### Product Grid
- 3-column responsive grid
- Each product card shows: image, category badge, name, rating stars, price, Add to Cart button
- If item is already in cart: shows green "In Cart" badge overlay, button turns green

#### No Results State
- Friendly message with icon when filters return 0 products

### Key Implementation
```tsx
// All filtering/sorting done with useMemo — no performance issues
const filtered = useMemo(() => {
  return products
    .filter(p => category === "All" || p.category === category)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => p.price <= maxPrice)
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });
}, [search, category, sort, maxPrice]);
```

---

## Page 3: Product Detail (`/product/:id`)

**File**: `src/pages/ProductDetail.tsx`

### Purpose
Individual product page with full details AND the core MBA-powered recommendation feature.

### Features

#### Product Info Section
- Product image (large, square)
- Category badge overlay
- Product name, star rating (visual stars), review count
- Price in large text
- Description paragraph
- Quantity selector (+/−)
- "Add to Cart" button or "In Cart" indicator

#### Frequently Bought Together (FBT)
This is the star feature of the page. Shows 3 products bundled together (current product + 2 recommendations):

```
[Product Image] + [Rec 1 Image] + [Rec 2 Image]
Total: £XX.XX       [Add All 3 to Cart button]
```

The bundle replicates Amazon's "Frequently Bought Together" section exactly.

#### Customers Also Bought Grid
Shows up to 4 more recommended products. Each card shows:
- Product image, name, price
- **Confidence bar**: a green progress bar showing "78% confidence" — meaning 78% of people who bought the current product also bought this one

### How Recommendations Work
```tsx
// associationRules maps each product to its recommended product IDs
const associationRules: Record<number, number[]> = {
  1: [3, 7, 12, 5, 9],    // product 1 → buy products 3, 7, 12, 5, 9
  2: [5, 9, 14, 1, 8],
  ...  // all 20 products mapped
};

// Get recs for current product
const recIds = associationRules[product.id] || [];
const recProducts = recIds.map(id => products.find(p => p.id === id)).filter(Boolean);

// First 2 go into FBT bundle, next 4 go into "Also Bought" grid
const fbt = recProducts.slice(0, 2);
const alsoBought = recProducts.slice(2, 6);
```

**Confidence percentage** is a mock formula:
```tsx
const getConf = (idx: number) => 78 - idx * 7;  // 78%, 71%, 64%, 57%...
```
When backend is connected, real confidence values come from the mined rules.

### Key Implementation Notes
- `useParams()` gets the `:id` from the URL
- `useState` tracks quantity (min 1)
- `products.find(p => p.id === id)` looks up the product
- If product not found, shows "Product not found" message

---

## Page 4: Cart (`/cart`)

**File**: `src/pages/Cart.tsx`

### Purpose
Shopping cart with item management AND Amazon-style live recommendation box.

### Features

#### Cart Items List (left column)
Each item shows:
- Product image (thumbnail)
- Name and price per unit
- Quantity control (+/− buttons) using `updateQuantity()`
- Remove button (trash icon) using `removeFromCart()`
- Line total (price × quantity)

#### "Don't Forget These!" Recommendation Box
Yellow-highlighted box (like Amazon's "Customers who bought items in your cart also bought:"). Shows up to 3 products recommended based on what's currently in the cart.

**Algorithm for cart-based recommendations:**
```tsx
function getRecommendations(cartIds: number[]): Product[] {
  const scores: Record<number, number> = {};
  cartIds.forEach(id => {
    (associationRules[id] || []).forEach(recId => {
      if (!cartIds.includes(recId)) {
        scores[recId] = (scores[recId] || 0) + 1;
      }
    });
  });
  // Sort by score (most co-occurring gets top spot)
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => products.find(p => p.id === Number(id)))
    .filter(Boolean) as Product[];
}
```

This is the correct MBA approach: for each item in cart, look up its rules, aggregate recommendation scores, return top-scoring products.

#### Order Summary (right column)
- Subtotal
- Delivery: FREE if subtotal ≥ £30, else £2.99
- Total in large text
- "Proceed to Checkout" button
- Free delivery progress bar (e.g., "Add £X.XX more for free delivery")

#### Empty Cart State
When cart is empty, shows a friendly illustration, message, and "Continue Shopping" button.

---

## Page 5: Search Results (`/search?q=...`)

**File**: `src/pages/SearchResults.tsx`

### Current Status: PLACEHOLDER

Currently shows a simple placeholder message "Coming Soon". 

### Planned Implementation
- Read `?q=` from URL using `useSearchParams()`
- Filter products matching the query
- Show results grid (same cards as Shop)
- "People also searched for" section using association rules
- "No results" state with suggestions

---

## Navigation Flow Summary

```
Home → click product → ProductDetail
Home → Start Shopping → Shop
Shop → click product → ProductDetail
ProductDetail → Add to Cart → Cart (via Navbar badge)
ProductDetail → Add All 3 FBT → Cart
Cart → recommendation → ProductDetail
Navbar search → SearchResults
Any page → Admin link → Admin Dashboard
```
