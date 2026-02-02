import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface HealthResponse {
  status: string;
}

export default function HomePage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div style={{ padding: "20px" }}>
      <h1>Tht Payment Portal</h1>
      {/* Api Status */}
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <h3>Estado del API</h3>

        {loading && <span style={{ color: "orange" }}>⏳ Conectando...</span>}

        {error && (
          <div style={{ color: "red" }}>
            Error: No se pudo conectar con{" "}
            {import.meta.env.VITE_API_URL || "localhost"}
          </div>
        )}

        {healthData && <div style={{ color: "green" }}>Online.</div>}
      </div>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <Link to="/quote?amount=20">Quote Page -&gt; 20 USD</Link>
        <Link to="/confirmation">Confirmation Page</Link>
      </div>
    </div>
  );
}
