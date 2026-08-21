import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";

export default function SignupPage({ onLogin }) {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "buyer",
    username: "",
    shopName: "",
    sellerId: "",
    shopAddress: "",
    location: "",
    profilePic: null,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setForm({ ...form, profilePic: e.target.files[0] });
  }

  // Step 1 → Step 2
  function handleStep1(e) {
    e.preventDefault();
    setStep(2);
  }

  // Step 2 → Step 3 (sellers) OR submit (buyers)
  function handleStep2(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    if (form.accountType === "seller") {
      setStep(3);
    } else {
      handleSubmit();
    }
  }

  // Final submit (called from step 2 for buyers, step 3 for sellers)
  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/signup",
        {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.accountType === "buyer" ? "finder" : "seller",
          username: form.username,
          shopName: form.shopName,
          sellerId: form.sellerId,
          shopAddress: form.shopAddress,
          location: form.location,
          // profilePic skipped for now, we'll add multer separately
        }
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));

      // ── show custom success overlay instead of browser alert ──
      setShowSuccess(true);
      setTimeout(() => {
        onLogin(form.name, form.email, form.accountType);
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create an Account</h2>

        {error && <div className="auth-error">{error}</div>}

        {/* ───── STEP 1: Pick Role ───── */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="auth-form">
            <div className="form-group">
              <label>I want to join as a...</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="accountType"
                    value="buyer"
                    checked={form.accountType === "buyer"}
                    onChange={handleChange}
                  />
                  Book Finder
                </label>
                <label>
                  <input
                    type="radio"
                    name="accountType"
                    value="seller"
                    checked={form.accountType === "seller"}
                    onChange={handleChange}
                  />
                  Book Seller
                </label>
              </div>
            </div>

            <button type="submit" className="btn-orange auth-btn">
              Continue
            </button>
          </form>
        )}

        {/* ───── STEP 2: Common Fields ───── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-field-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-field-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
            </div>

            <div className="step-btns">
              <button
                type="button"
                className="btn-back"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button type="submit" className="btn-orange auth-btn">
                {form.accountType === "seller" ? "Next" : "Create Account"}
              </button>
            </div>
          </form>
        )}

        {/* ───── STEP 3: Seller-Only Fields ───── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="auth-form">

            <div className="form-group">
            <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="e.g. kitaab_wala (must be unique)"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Shop Name</label>
              <input
                type="text"
                name="shopName"
                placeholder="Enter your shop name"
                value={form.shopName}
                onChange={handleChange}
                required
              />
            </div>

            {/* <div className="form-group">
              <label>Seller ID</label>
              <input
                type="text"
                name="sellerId"
                placeholder="Enter your seller ID"
                value={form.sellerId}
                onChange={handleChange}
                required
              />
            </div> */}

            <div className="form-group">
              <label>Shop Address</label>
              <input
                type="text"
                name="shopAddress"
                placeholder="Enter your shop address"
                value={form.shopAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                placeholder="City / Area"
                value={form.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Profile Picture</label>
              <input
                type="file"
                name="profilePic"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="step-btns">
              <button
                type="button"
                className="btn-back"
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button type="submit" className="btn-orange auth-btn">
                Create Account
              </button>
            </div>
          </form>
        )}

        <p className="auth-footer">
          Already have an account?{" "}
          <button className="link-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        </p>
      </div>

      {/* ── SUCCESS OVERLAY ── */}
      {showSuccess && (
        <div className="signup-success-overlay">
          <div className="signup-success-card">
            <div className="signup-success-icon">
              <i className="fas fa-check"></i>
            </div>
            <h3>Signup Successful!</h3>
            <p>Taking you to your dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
