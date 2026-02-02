import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface PaymentStatus {
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  fullName: string;
  email: string;
  createdAt: string;
}

interface Balances {
  usd: number;
  cop: number;
}

export default function ConfirmationPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null,
  );
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Recuperar el ID guardado antes del redirect a Supra
      const paymentId = localStorage.getItem("pendingPaymentId");

      if (!paymentId) {
        setError(
          "No payment found. You may have already completed this payment.",
        );
        setLoading(false);
        return;
      }

      try {
        // Consultar status y balances en paralelo
        const [statusRes, balancesRes] = await Promise.all([
          api.getPaymentStatus(paymentId),
          api.getBalances(),
        ]);

        setPaymentStatus(statusRes);
        setBalances(balancesRes);

        // Limpiar localStorage si el pago fue exitoso
        if (statusRes.status === "PAID") {
          localStorage.removeItem("pendingPaymentId");
        }
      } catch (e: any) {
        setError(e.message || "Error fetching payment status");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatMoney = (value: number, decimals: number = 2): string => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "PAID":
        return { emoji: "✅", text: "Payment Successful", color: "#22c55e" };
      case "PENDING":
        return { emoji: "⏳", text: "Payment Pending", color: "#f59e0b" };
      case "EXPIRED":
        return { emoji: "❌", text: "Payment Expired", color: "#ef4444" };
      case "CREATED":
        return { emoji: "🕐", text: "Payment Created", color: "#3b82f6" };
      default:
        return { emoji: "❓", text: status, color: "#6b7280" };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Loading...</h1>
        <p>Checking your payment status...</p>
      </div>
    );
  }

  // Error state
  if (error || !paymentStatus) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>⚠️ Error</h1>
        <p style={{ color: "#ef4444" }}>{error || "Unknown error"}</p>
        <Link to="/">← Back to Home</Link>
      </div>
    );
  }

  // Success state
  const statusDisplay = getStatusDisplay(paymentStatus.status);

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Payment Confirmation</h1>

      {/* Status Card */}
      <div
        style={{
          padding: "20px",
          border: `2px solid ${statusDisplay.color}`,
          borderRadius: "8px",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px" }}>{statusDisplay.emoji}</div>
        <h2 style={{ color: statusDisplay.color, margin: "10px 0" }}>
          {statusDisplay.text}
        </h2>
      </div>

      <div
        style={{
          padding: "20px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>Payment Details</h3>
        <p>
          <strong>Amount:</strong> ${formatMoney(paymentStatus.amount)}{" "}
          {paymentStatus.currency}
        </p>
        <p>
          <strong>Name:</strong> {paymentStatus.fullName}
        </p>
        <p>
          <strong>Email:</strong> {paymentStatus.email}
        </p>
        <p>
          <strong>Payment ID:</strong> <code>{paymentStatus.paymentId}</code>
        </p>
        <p>
          <strong>Created:</strong>{" "}
          {new Date(paymentStatus.createdAt).toLocaleString()}
        </p>
      </div>

      {balances && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3>Account Balances</h3>
          <p>
            <strong>USD:</strong> ${formatMoney(balances.usd)}
          </p>
          <p>
            <strong>COP:</strong> ${formatMoney(balances.cop)}
          </p>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Link to="/" style={{ marginRight: "20px" }}>
          ← Back to Home
        </Link>
        <Link to="/quote?amount=10000">Make Another Payment</Link>
      </div>
    </div>
  );
}
