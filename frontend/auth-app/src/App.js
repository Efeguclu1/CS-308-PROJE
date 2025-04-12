import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Shipping from "./pages/Shipping";
import Payment from "./pages/Payment";
import NavigationBar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Review from './pages/Review';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import ReviewApproval from './pages/ProductManager/ReviewApproval';
import ProductDetails from './components/shopping/ProductDetails';
import ProtectedRoute from './components/ProtectedRoute';
import { setupAxiosInterceptors } from './utils/auth';
import axios from 'axios';

// Set up axios interceptors
setupAxiosInterceptors(axios);

function App() {
  // Add some debug logs for local storage
  useEffect(() => {
    console.log('App mounted, checking auth state');
    console.log('Token in localStorage:', localStorage.getItem('token'));
    console.log('UserData in localStorage:', localStorage.getItem('userData'));
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <NavigationBar />
          <main className="min-vh-100">
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Checkout flow */}
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/shipping" element={
                <ProtectedRoute>
                  <Shipping />
                </ProtectedRoute>
              } />
              <Route path="/checkout/payment" element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } />
              <Route path="/checkout/review" element={
                <ProtectedRoute>
                  <Review />
                </ProtectedRoute>
              } />
              
              {/* Other protected routes */}
              <Route path="/order-success" element={
                <ProtectedRoute>
                  <OrderSuccess />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/admin/review-approval" element={
                <ProtectedRoute requiredRole="product_manager">
                  <ReviewApproval />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
