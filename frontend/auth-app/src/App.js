import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Products from "./pages/Products";
import Register from "./pages/Register"; 
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Shipping from "./pages/Shipping";
import Payment from "./pages/Payment";
import Review from "./pages/Review";
import CheckoutRegister from "./pages/CheckoutRegister"; // Added custom registration page for checkout
import NavigationBar from "./components/Navbar"; // Added Navbar
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ProductDetails from "./components/shopping/ProductDetails";
import ShoppingPage from "./components/shopping/ShoppingPage"; 
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import ReviewApproval from './pages/ProductManager/ReviewApproval';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <NavigationBar /> {/* Navbar will appear on every page */}
          <main>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/products" element={<Products />} />
              <Route path="/shopping" element={<ShoppingPage />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/register" element={<CheckoutRegister />} />
              <Route path="/checkout/shipping" element={<Shipping />} />
              <Route path="/checkout/payment" element={<Payment />} />
              <Route path="/checkout/review" element={<Review />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/admin/review-approval" element={<ReviewApproval />} />
            </Routes>
          </main>
          <Footer />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
