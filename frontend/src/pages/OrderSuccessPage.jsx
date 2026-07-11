import { useNavigate } from "react-router-dom";

export default function OrderSuccessPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "70vh", gap: "16px", textAlign: "center"
    }}>
      <i className="fas fa-check-circle" style={{ fontSize: "4rem", color: "#2e7d32" }}></i>
      <h2 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Order Placed!</h2>
      <p style={{ color: "#666" }}>Your order has been sent to the seller. They'll get in touch soon!</p>
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "10px 24px", background: "#2e7d32",
          color: "#fff", border: "none", borderRadius: "8px",
          fontSize: "1rem", cursor: "pointer", marginTop: "8px"
        }}
      >
        Back to Home
      </button>
    </div>
  );
}