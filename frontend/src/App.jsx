import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate  } from "react-router-dom";


import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SellerDashboard from "./pages/SellerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import SearchResultsPage from "./pages/SearchResultsPage";
import BookProductPage from "./pages/BookProductPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import ConversationList from "./pages/ConversationList";
import ChatPage from "./pages/ChatPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";

import "./App.css";


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const [user, setUser] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
});
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ login handler
  function handleLogin(name, email, accountType, from) {
    const newUser = {
      name: name || email.split("@")[0],
      email,
      role: accountType,
    };

    setUser(newUser);

    // if came from a specific page, go back there
    if (from && from !== "/") {
      navigate(from);
    } else if (accountType === "seller") {
      navigate("/sellerdashboard");
    } else {
      navigate("/");
    }
  }

  // ✅ logout
  function handleLogout() {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <div className="app-wrapper">
    {!["/login", "/signup"].includes(location.pathname) && (
  <Navbar user={user} onLogout={handleLogout} />
)}

      <main>
         <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/home" element={<Navigate to="/" />} />
          <Route path="/search" element={<SearchResultsPage />} /> ///idk if I should add this here
          <Route path="/book/:id" element={<BookProductPage />} /> //same for this one
          <Route path="/seller/:sellerId" element={<SellerProfilePage />} />
          <Route path="/checkout/:bookId" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route
            path="/login"
            element={<LoginPage onLogin={handleLogin} />}
          />
          <Route
            path="/signup"
            element={<SignupPage onLogin={handleLogin} />}
          />
          <Route path="/sellerdashboard" element={<SellerDashboard />} />
          <Route path="/buyerdashboard" element={<BuyerDashboard />} />
          <Route path="/messages" element={<ConversationList />} />
          <Route path="/messages/:id" element={<ChatPage />} />
        </Routes>
      </main>

      {/* hide footer in dashboards */}
     {!["/login", "/signup", "/buyerdashboard"].includes(location.pathname) && (
  <Footer />
)}
    </div>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}