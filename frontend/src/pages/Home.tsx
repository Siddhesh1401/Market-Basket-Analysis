import { Link } from "react-router-dom";
import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { FiShoppingCart, FiTrendingUp } from "react-icons/fi";
import { BsCart3, BsCpuFill, BsStars } from "react-icons/bs";

const Home = () => {
  const { addToCart } = useCart();
  const topProducts = products.slice(0, 6);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🤖 AI-Powered Recommendations</div>
          <h1 className="hero-title">
            Shop Smarter.<br />
            <span className="hero-highlight">We Know What You Need Next.</span>
          </h1>
          <p className="hero-subtitle">
            SmartBasket uses Market Basket Analysis to predict what you'll want to buy —
            just like Amazon, powered by real retail data and machine learning.
          </p>
          <div className="hero-buttons">
            <Link to="/shop" className="btn btn-primary">
              <BsCart3 /> Browse Products
            </Link>
            <Link to="/admin" className="btn btn-secondary">
              <BsCpuFill /> View Analytics
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">541K+</span>
              <span className="stat-label">Transactions Analysed</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">4,070</span>
              <span className="stat-label">Unique Products</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">847+</span>
              <span className="stat-label">Association Rules</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-basket-animation">
            <div className="floating-card card-1">🥛 Milk → 🍞 Bread <span className="conf">72%</span></div>
            <div className="floating-card card-2">🥚 Eggs → 🥓 Bacon <span className="conf">65%</span></div>
            <div className="floating-card card-3">🧀 Cheese → 🍷 Wine <span className="conf">58%</span></div>
            <div className="basket-icon">🛒</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Three simple steps to smarter shopping</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">🛒</div>
            <h3>Add Items to Cart</h3>
            <p>Browse our store and add products you want to your cart — just like any online shop.</p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">🤖</div>
            <h3>AI Analyses Your Cart</h3>
            <p>Our Association Rule Mining model analyses your cart against 541,000 real transactions.</p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">✨</div>
            <h3>Get Smart Recommendations</h3>
            <p>Instantly see what other customers bought alongside your items — with confidence scores.</p>
          </div>
        </div>
      </section>

      {/* Top Products Preview */}
      <section className="top-products">
        <div className="section-header">
          <div>
            <h2 className="section-title">Top Selling Products</h2>
            <p className="section-subtitle">Most popular items this week</p>
          </div>
          <Link to="/shop" className="btn btn-outline">View All Products →</Link>
        </div>
        <div className="products-grid">
          {topProducts.map((product) => (
            <div key={product.id} className="product-card">
              <Link to={`/product/${product.id}`}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} className="product-image" />
                  <span className="product-category">{product.category}</span>
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
                    className="btn-add-cart"
                    onClick={() => addToCart(product)}
                  >
                    <FiShoppingCart /> Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Banner */}
      <section className="features-banner">
        <div className="feature-item">
          <BsStars className="feature-icon" />
          <div>
            <h4>Real ML Model</h4>
            <p>Trained on actual UK retail data</p>
          </div>
        </div>
        <div className="feature-item">
          <FiTrendingUp className="feature-icon" />
          <div>
            <h4>Live Updates</h4>
            <p>Recommendations update as cart changes</p>
          </div>
        </div>
        <div className="feature-item">
          <BsCpuFill className="feature-icon" />
          <div>
            <h4>Admin Dashboard</h4>
            <p>Full analytics and model controls</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
