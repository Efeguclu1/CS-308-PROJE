import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Products from "./pages/Products";
import Register from "./pages/Register"; // ✅ Kayıt sayfasını eklediğimize emin olalım
import Login from "./pages/Login";
import NavigationBar from "./components/Navbar"; // ✅ Navbar'ı ekledik
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <NavigationBar /> {/* ✅ Navbar her sayfada gözükecek */}
      <main>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
