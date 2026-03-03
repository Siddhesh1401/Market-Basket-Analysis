import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import SearchResults from "./pages/SearchResults";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Rules from "./pages/admin/Rules";
import Segmentation from "./pages/admin/Segmentation";
import Prediction from "./pages/admin/Prediction";
import AlgorithmCompare from "./pages/admin/AlgorithmCompare";
import DataUpload from "./pages/admin/DataUpload";
import "./index.css";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Customer Panel */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/search" element={<SearchResults />} />

            {/* Admin Panel */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="rules" element={<Rules />} />
              <Route path="segmentation" element={<Segmentation />} />
              <Route path="prediction" element={<Prediction />} />
              <Route path="algorithm" element={<AlgorithmCompare />} />
              <Route path="upload" element={<DataUpload />} />
            </Route>
          </Routes>
        </main>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
