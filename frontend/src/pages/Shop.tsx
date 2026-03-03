import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { products, categories } from "../data/products";
import { useCart } from "../context/CartContext";
import { FiShoppingCart, FiSearch, FiX } from "react-icons/fi";

const Shop = () => {
  const { addToCart, cart } = useCart();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(10);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory !== "All") list = list.filter(p => p.category === activeCategory);
    if (search.trim()) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    list = list.filter(p => p.price <= maxPrice);
    if (sortBy === "popular") list.sort((a, b) => b.reviews - a.reviews);
    else if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [search, activeCategory, sortBy, maxPrice]);

  const isInCart = (id: number) => cart.some(i => i.id === id);

  return (
    <div className="shop-page">
      {/* Page Header */}
      <div className="shop-header">
        <div>
          <h1 className="shop-title">All Products</h1>
          <p className="shop-subtitle">{filtered.length} products found</p>
        </div>
        <div className="shop-controls">
          <div className="shop-search-wrap">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="shop-search"
            />
            {search && <button className="search-clear" onClick={() => setSearch("")}><FiX /></button>}
          </div>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="popular">Most Popular</option>
            <option value="rating">Top Rated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="shop-body">
        {/* Sidebar */}
        <aside className="shop-sidebar">
          <div className="sidebar-section">
            <h4 className="sidebar-heading">Price Range</h4>
            <p className="price-range-label">Up to £{maxPrice.toFixed(2)}</p>
            <input
              type="range" min="1" max="10" step="0.5"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="price-slider"
            />
            <div className="price-range-ends"><span>£0</span><span>£10</span></div>
          </div>
          <div className="sidebar-section">
            <h4 className="sidebar-heading">Category</h4>
            {categories.map(cat => (
              <label key={cat} className="sidebar-category-label">
                <input
                  type="radio"
                  name="category"
                  checked={activeCategory === cat}
                  onChange={() => setActiveCategory(cat)}
                />
                {cat}
                <span className="category-count">
                  {cat === "All" ? products.length : products.filter(p => p.category === cat).length}
                </span>
              </label>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="products-area">
          {filtered.length === 0 ? (
            <div className="no-results">
              <div style={{ fontSize: "3rem" }}>🔍</div>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
              <button className="btn btn-primary" onClick={() => { setSearch(""); setActiveCategory("All"); setMaxPrice(10); }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map(product => (
                <div key={product.id} className="product-card">
                  <Link to={`/product/${product.id}`}>
                    <div className="product-image-wrap">
                      <img src={product.image} alt={product.name} className="product-image" />
                      <span className="product-category">{product.category}</span>
                      {isInCart(product.id) && <span className="in-cart-badge">✓ In Cart</span>}
                    </div>
                  </Link>
                  <div className="product-info">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="product-name">{product.name}</h3>
                    </Link>
                    <div className="product-rating">
                      {"★".repeat(Math.floor(product.rating))}{"☆".repeat(5 - Math.floor(product.rating))}
                      <span className="rating-count">({product.reviews})</span>
                    </div>
                    <div className="product-footer">
                      <span className="product-price">£{product.price.toFixed(2)}</span>
                      <button
                        className={`btn-add-cart ${isInCart(product.id) ? "in-cart" : ""}`}
                        onClick={() => addToCart(product)}
                      >
                        <FiShoppingCart />
                        {isInCart(product.id) ? "Add More" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
