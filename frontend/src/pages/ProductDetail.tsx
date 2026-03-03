import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { FiShoppingCart, FiArrowLeft, FiPlus, FiMinus } from "react-icons/fi";
import { BsStarFill, BsStarHalf, BsStar } from "react-icons/bs";

// Mock association rules: product id → recommended product ids
const associationRules: Record<number, number[]> = {
  1: [2, 3, 4, 9, 7],   // Milk → Bread, Eggs, Butter, Yoghurt, OJ
  2: [1, 4, 6, 3, 9],   // Bread → Milk, Butter, Jam, Eggs, Yoghurt
  3: [8, 1, 4, 2, 5],   // Eggs → Bacon, Milk, Butter, Bread, Cheese
  4: [2, 1, 6, 3, 9],   // Butter → Bread, Milk, Jam, Eggs, Yoghurt
  5: [10, 12, 13, 8, 7],// Cheese → OliveOil, Pasta, Sauce, Bacon, OJ
  6: [2, 4, 1, 9, 3],   // Jam → Bread, Butter, Milk, Yoghurt, Eggs
  7: [11, 3, 1, 9, 16], // OJ → Cornflakes, Eggs, Milk, Yoghurt, Biscuits
  8: [3, 2, 1, 15, 4],  // Bacon → Eggs, Bread, Milk, WashingUp, Butter
  9: [1, 7, 11, 2, 3],  // Yoghurt → Milk, OJ, Cornflakes, Bread, Eggs
  10: [5, 12, 13, 17, 18], // OliveOil → Cheese, Pasta, Sauce, Chicken, Rice
  11: [1, 7, 9, 3, 2],  // Cornflakes → Milk, OJ, Yoghurt, Eggs, Bread
  12: [13, 10, 5, 17, 18],// Pasta → Sauce, OliveOil, Cheese, Chicken, Rice
  13: [12, 10, 17, 5, 18],// Sauce → Pasta, OliveOil, Chicken, Cheese, Rice
  14: [10, 7, 1, 19, 15],// Water → OliveOil, OJ, Milk, Coffee, WashingUp
  15: [20, 14, 10, 19, 16],// WashingUp → Soap, Water, OliveOil, Coffee, Biscuits
  16: [19, 7, 1, 9, 11], // Biscuits → Coffee, OJ, Milk, Yoghurt, Cornflakes
  17: [18, 12, 13, 10, 5],// Chicken → Rice, Pasta, Sauce, OliveOil, Cheese
  18: [17, 12, 13, 10, 5],// Rice → Chicken, Pasta, Sauce, OliveOil, Cheese
  19: [16, 14, 1, 7, 9], // Coffee → Biscuits, Water, Milk, OJ, Yoghurt
  20: [15, 14, 19, 10, 7],// Soap → WashingUp, Water, Coffee, OliveOil, OJ
};

const confidences: Record<string, number> = {
  "1-2": 0.78, "1-3": 0.65, "1-4": 0.61, "1-9": 0.54, "1-7": 0.48,
  "2-1": 0.82, "2-4": 0.71, "2-6": 0.63, "2-3": 0.57, "2-9": 0.49,
  "3-8": 0.79, "3-1": 0.68, "3-4": 0.62, "3-2": 0.55, "3-5": 0.47,
  "4-2": 0.75, "4-1": 0.69, "4-6": 0.58, "4-3": 0.52, "4-9": 0.44,
  "5-10": 0.72, "5-12": 0.64, "5-13": 0.59, "5-8": 0.51, "5-7": 0.43,
};
const getConf = (from: number, to: number) =>
  confidences[`${from}-${to}`] || (0.4 + Math.random() * 0.3);

const StarRating = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="star-rating">
      {Array.from({ length: full }).map((_, i) => <BsStarFill key={i} />)}
      {half && <BsStarHalf />}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => <BsStar key={i} />)}
    </span>
  );
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const product = products.find(p => p.id === Number(id));
  if (!product) return (
    <div className="no-results" style={{ marginTop: 80 }}>
      <div style={{ fontSize: "3rem" }}>😕</div>
      <h3>Product not found</h3>
      <button className="btn btn-primary" onClick={() => navigate("/shop")}>Back to Shop</button>
    </div>
  );

  const ruleIds = associationRules[product.id] || [];
  const recommended = ruleIds.map(rid => products.find(p => p.id === rid)).filter(Boolean) as typeof products;
  const bundleItems = recommended.slice(0, 2);
  const bundleTotal = product.price + bundleItems.reduce((s, p) => s + p.price, 0);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddBundle = () => {
    addToCart(product);
    bundleItems.forEach(p => addToCart(p));
  };

  const isInCart = (pid: number) => cart.some(i => i.id === pid);

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{product.name}</span>
      </div>

      {/* Main Product Section */}
      <div className="pd-main">
        <div className="pd-image-section">
          <div className="pd-image-wrap">
            <img src={product.image} alt={product.name} className="pd-image" />
            <span className="pd-category-badge">{product.category}</span>
          </div>
        </div>

        <div className="pd-info-section">
          <h1 className="pd-title">{product.name}</h1>
          <div className="pd-rating-row">
            <StarRating rating={product.rating} />
            <span className="pd-rating-num">{product.rating}</span>
            <span className="pd-rating-count">({product.reviews} reviews)</span>
          </div>
          <div className="pd-price">£{product.price.toFixed(2)}</div>
          <p className="pd-description">{product.description}</p>

          <div className="pd-qty-row">
            <span className="pd-label">Quantity</span>
            <div className="qty-control">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}><FiMinus /></button>
              <span className="qty-value">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}><FiPlus /></button>
            </div>
          </div>

          <div className="pd-action-row">
            <button
              className={`btn btn-primary pd-add-btn ${added ? "success" : ""}`}
              onClick={handleAddToCart}
            >
              <FiShoppingCart />
              {added ? "✓ Added to Cart!" : `Add ${qty > 1 ? qty + "x " : ""}to Cart`}
            </button>
            <Link to="/cart" className="btn btn-outline">View Cart</Link>
          </div>

          <div className="pd-meta">
            <span className="pd-meta-item">✓ In stock</span>
            <span className="pd-meta-item">🚚 Free delivery over £30</span>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together */}
      {bundleItems.length > 0 && (
        <section className="fbt-section">
          <h2 className="section-title">Frequently Bought Together</h2>
          <div className="fbt-box">
            <div className="fbt-items">
              <div className="fbt-item">
                <img src={product.image} alt={product.name} />
                <span>{product.name}</span>
                <span className="fbt-price">£{product.price.toFixed(2)}</span>
                <span className="fbt-this">This item</span>
              </div>
              {bundleItems.map((p, i) => (
                <div key={p.id} className="fbt-item">
                  {i === 0 && <span className="fbt-plus">+</span>}
                  {i === 1 && <span className="fbt-plus">+</span>}
                  <img src={p.image} alt={p.name} />
                  <span>{p.name}</span>
                  <span className="fbt-price">£{p.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="fbt-action">
              <p className="fbt-total">Bundle Total: <strong>£{bundleTotal.toFixed(2)}</strong></p>
              <button className="btn btn-primary" onClick={handleAddBundle}>
                <FiShoppingCart /> Add All {bundleItems.length + 1} to Cart
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Customers Also Bought */}
      <section className="also-bought-section">
        <h2 className="section-title">Customers Who Bought This Also Bought</h2>
        <div className="also-bought-grid">
          {recommended.slice(0, 5).map(rec => (
            <div key={rec.id} className="also-bought-card">
              <Link to={`/product/${rec.id}`}>
                <img src={rec.image} alt={rec.name} />
              </Link>
              <Link to={`/product/${rec.id}`}><p className="ab-name">{rec.name}</p></Link>
              <p className="ab-price">£{rec.price.toFixed(2)}</p>
              <div className="ab-confidence">
                <div className="conf-bar">
                  <div className="conf-fill" style={{ width: `${Math.round(getConf(product.id, rec.id) * 100)}%` }} />
                </div>
                <span>{Math.round(getConf(product.id, rec.id) * 100)}% confidence</span>
              </div>
              <button
                className={`btn-add-cart ${isInCart(rec.id) ? "in-cart" : ""}`}
                onClick={() => addToCart(rec)}
              >
                <FiShoppingCart /> {isInCart(rec.id) ? "Add More" : "Add"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Back button */}
      <button className="btn btn-outline back-btn" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Back
      </button>
    </div>
  );
};

export default ProductDetail;

