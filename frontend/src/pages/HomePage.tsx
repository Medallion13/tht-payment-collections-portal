import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

interface HealthResponse {
  status: string;
}

// Hardcoded for tessting
const TEST_PAYMENT_ID = "50eb2474-8924-4e0a-80e6-237f5159e814";

export default function HomePage() {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [usdAmount, setUsdAmount] = useState<string>("100");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.healthCheck();
        setHealthData(data);
      } catch (err) {
        console.error(err);
        setError("Health check fail");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGoToQuote = () => {
    const amount = parseFloat(usdAmount);
    if (amount > 0) {
      navigate(`/quote?amount=${amount}`);
    }
  };

  const handleGoToConfirmation = () => {
    // save the testing value and navigate
    localStorage.setItem("pendingPaymentId", TEST_PAYMENT_ID);
    navigate("/confirmation");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h1>THT Payment Portal</h1>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>Estado del API</h3>

        {loading && <span style={{ color: "orange" }}>⏳ Conectando...</span>}

        {error && (
          <div style={{ color: "red" }}>
            ❌ Error: No se pudo conectar con{" "}
            {import.meta.env.VITE_API_URL || "localhost"}
          </div>
        )}

        {healthData && <div style={{ color: "green" }}>✅ Online</div>}
      </div>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>Iniciar Pago</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span>$</span>
          <input
            type="number"
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            placeholder="100"
            min="1"
            style={{
              padding: "8px",
              fontSize: "16px",
              width: "120px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <span>USD</span>
          <button
            onClick={handleGoToQuote}
            disabled={!usdAmount || parseFloat(usdAmount) <= 0}
            style={{
              padding: "8px 16px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Go to Quote →
          </button>
        </div>
      </div>

      <div
        style={{
          padding: "15px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          backgroundColor: "#f9fafb",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>Testing</h3>
        <p style={{ fontSize: "12px", color: "#666", margin: "0 0 10px 0" }}>
          Payment ID: <code>{TEST_PAYMENT_ID}</code>
        </p>
        <button
          onClick={handleGoToConfirmation}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          View Confirmation →
        </button>
      </div>
    </div>
  );
}
