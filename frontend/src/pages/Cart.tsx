import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { products } from "../data/products";
import { FiTrash2, FiPlus, FiMinus, FiShoppingCart, FiArrowRight } from "react-icons/fi";
import { BsLightbulbFill } from "react-icons/bs";

// Same association rules as ProductDetail
const associationRules: Record<number, number[]> = {
  1: [2, 3, 4, 9, 7],
  2: [1, 4, 6, 3, 9],
  3: [8, 1, 4, 2, 5],
  4: [2, 1, 6, 3, 9],
  5: [10, 12, 13, 8, 7],
  6: [2, 4, 1, 9, 3],
  7: [11, 3, 1, 9, 16],
  8: [3, 2, 1, 15, 4],
  9: [1, 7, 11, 2, 3],
  10: [5, 12, 13, 17, 18],
  11: [1, 7, 9, 3, 2],
  12: [13, 10, 5, 17, 18],
  13: [12, 10, 17, 5, 18],
  14: [10, 7, 1, 19, 15],
  15: [20, 14, 10, 19, 16],
  16: [19, 7, 1, 9, 11],
  17: [18, 12, 13, 10, 5],
  18: [17, 12, 13, 10, 5],
  19: [16, 14, 1, 7, 9],
  20: [15, 14, 19, 10, 7],
};

const getRecommendations = (cartIds: number[]) => {
  const scores: Record<number, number> = {};
  cartIds.forEach(id => {
    (associationRules[id] || []).forEach((rec, i) => {
      if (!cartIds.includes(rec)) {
        scores[rec] = (scores[rec] || 0) + (5 - i);
      }
    });
  });
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => products.find(p => p.id === Number(id)))
    .filter(Boolean) as typeof products;
};

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { addToCart } = useCart();

  const cartIds = cart.map(i => i.id);
  const recommendations = getRecommendations(cartIds);

  const delivery = cartTotal > 30 ? 0 : 0.99;
  const total = cartTotal + delivery;

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <div style={{ fontSize: "4rem" }}>🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some products to get smart recommendations!</p>
        <Link to="/shop" className="btn btn-primary">
          <FiShoppingCart /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-title">Your Cart <span className="cart-count-badge">{cart.length} item{cart.length !== 1 ? "s" : ""}</span></h1>

      <div className="cart-layout">
        {/* Cart Items */}
        <div className="cart-items-section">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <Link to={`/product/${item.id}`}>
                <img src={item.image} alt={item.name} className="cart-item-img" />
              </Link>
              <div className="cart-item-info">
                <Link to={`/product/${item.id}`}>
                  <h3 className="cart-item-name">{item.name}</h3>
                </Link>
                <span className="cart-item-category">{item.category}</span>
                <div className="cart-item-price">£{item.price.toFixed(2)} each</div>
              </div>
              <div className="cart-item-controls">
                <div className="qty-control">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><FiMinus /></button>
                  <span className="qty-value">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><FiPlus /></button>
                </div>
                <div className="cart-item-subtotal">£{(item.price * item.quantity).toFixed(2)}</div>
                <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}

          <div className="cart-actions">
            <button className="btn btn-outline" onClick={clearCart}>Clear Cart</button>
            <Link to="/shop" className="btn btn-outline">Continue Shopping</Link>
          </div>

          {/* Recommendation Box */}
          {recommendations.length > 0 && (
            <div className="reco-box">
              <div className="reco-header">
                <BsLightbulbFill className="reco-icon" />
                <div>
                  <h3 className="reco-title">Don't Forget These!</h3>
                  <p className="reco-subtitle">Customers who bought your items also bought:</p>
                </div>
              </div>
              <div className="reco-items">
                {recommendations.map(rec => (
                  <div key={rec.id} className="reco-card">
                    <img src={rec.image} alt={rec.name} />
                    <p className="reco-name">{rec.name}</p>
                    <p className="reco-price">£{rec.price.toFixed(2)}</p>
                    <button className="reco-add-btn" onClick={() => addToCart(rec)}>
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2 className="summary-title">Order Summary</h2>
          <div className="summary-rows">
            {cart.map(item => (
              <div key={item.id} className="summary-row">
                <span>{item.name} × {item.quantity}</span>
                <span>£{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-divider" />
          <div className="summary-row">
            <span>Subtotal</span>
            <span>£{cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{delivery === 0 ? <span className="free-delivery">FREE</span> : `£${delivery.toFixed(2)}`}</span>
          </div>
          {delivery > 0 && (
            <p className="free-delivery-hint">Add £{(30 - cartTotal).toFixed(2)} more for free delivery</p>
          )}
          <div className="summary-divider" />
          <div className="summary-total">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>
          <button className="btn btn-primary checkout-btn">
            Proceed to Checkout <FiArrowRight />
          </button>
          <p className="secure-note">🔒 Secure checkout</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;

