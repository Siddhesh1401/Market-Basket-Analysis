import { Link, useLocation } from "react-router-dom";
import { FiShoppingCart, FiSearch, FiHome, FiGrid, FiSettings } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = location.pathname.startsWith("/admin");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🛒</span>
          <span className="logo-text">SmartBasket</span>
        </Link>

        {/* Search Bar */}
        {!isAdmin && (
          <form className="navbar-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">
              <FiSearch />
            </button>
          </form>
        )}

        {/* Nav Links */}
        <div className="navbar-links">
          {!isAdmin ? (
            <>
              <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
                <FiHome /> Home
              </Link>
              <Link to="/shop" className={`nav-link ${location.pathname === "/shop" ? "active" : ""}`}>
                <FiGrid /> Shop
              </Link>
              <Link to="/cart" className="nav-link cart-link">
                <FiShoppingCart />
                <span>Cart</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/admin" className="nav-link admin-btn">
                <FiSettings /> Admin
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link">
                ← Back to Store
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
