import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          <div>
            <h3 className="footer-brand">BookFinder</h3>
            <p className="footer-desc">
              Your one-stop destination for buying and selling books in Pakistan.
            </p>
          </div>

          <div>
            <h4 className="footer-heading">Customer Service</h4>
            <ul className="footer-links">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">How to Buy</a></li>
              <li><a href="#">Returns & Refunds</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">About Us</h4>
            <ul className="footer-links">
              <li><a href="#">About BookFinder</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Download App</h4>
            <div className="app-buttons">
              <button className="app-btn">
                <i className="fab fa-google-play"></i>
                <div>
                  <small>Get it on</small>
                  <span>Google Play</span>
                </div>
              </button>
              <button className="app-btn">
                <i className="fab fa-apple"></i>
                <div>
                  <small>Download on the</small>
                  <span>App Store</span>
                </div>
              </button>
            </div>
          </div>

        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 BookFinder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
