import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Products from "./pages/Products";
import Register from "./pages/Register"; // Make sure we've added the registration page
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

function App() {
  return (
    <CartProvider>
      <Router>
        <NavigationBar /> {/* Navbar will appear on every page */}
        <main>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/products" element={<Products />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/register" element={<CheckoutRegister />} />
            <Route path="/checkout/shipping" element={<Shipping />} />
            <Route path="/checkout/payment" element={<Payment />} />
            <Route path="/checkout/review" element={<Review />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </CartProvider>
  );
}

export default App;
