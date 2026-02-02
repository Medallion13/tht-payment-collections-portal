import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

// TODO check de herramientas que permiten compartir los modelos en monorepos para mantener consistencia de datos
interface QuoteResponse {
  quoteId: string;
  initialAmount: number;
  finalAmount: number;
  transactionCost: number;
  totalCost: number;
  exchangeRate: number;
  expiresAt: string;
}

export default function QuotePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  //get the amount form the URL o pass a default value for testing reasons
  const initialAmount = parseFloat(searchParams.get("amount") || "0");

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Timer
  useEffect(() => {
    if (!quote) return;

    const expiresAt = new Date(quote.expiresAt).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsLeft(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [quote]);

  const isExpired = secondsLeft === 0 && quote !== null;
  const isInvalidAmount = initialAmount <= 0;

  const handleGetQuote = async () => {
    if (isInvalidAmount) {
      setError("Invalid amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.getQuote(initialAmount);
      setQuote(data);
    } catch (e) {
      setError("error getting quote. Try Again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!quote || isExpired) return;

    navigate("/user-data", {
      state: {
        quoteId: quote.quoteId,
        totalCost: quote.totalCost,
        initialAmount: quote.initialAmount,
      },
    });
  };

  const formatMoney = (value: number, decimals: number = 2): string => {
    return (value / 100).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Quote USD to COP</h1>

      {isInvalidAmount ? (
        <p style={{ color: "red" }}>
          No amount provided. Access via: <code>quote?amount=number</code>
        </p>
      ) : (
        <p>
          <strong>Amount:</strong> ${initialAmount} USD
        </p>
      )}

      {!quote && !isInvalidAmount && (
        <button onClick={handleGetQuote} disabled={loading}>
          {loading ? "Loading..." : "Get Quote"}
        </button>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {quote && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: `1px solid ${isExpired ? "red" : "#ccc"}`,
          }}
        >
          <h3>Quote Details</h3>
          <p>
            <strong>Exchange Rate:</strong> ${" "}
            {formatMoney(quote.exchangeRate * 100)}
          </p>
          <p>
            <strong>Converted:</strong> $ {formatMoney(quote.finalAmount)} COP
          </p>
          <p>
            <strong>Fee:</strong> $ {formatMoney(quote.transactionCost)} COP
          </p>
          <p>
            <strong>Total to Pay:</strong> ${formatMoney(quote.totalCost)} COP
          </p>

          <p
            style={{
              fontSize: "14px",
              color: isExpired ? "red" : secondsLeft <= 10 ? "orange" : "#666",
              fontWeight: secondsLeft <= 10 ? "bold" : "normal",
            }}
          >
            {isExpired
              ? "⚠️ Quote expired - Please refresh"
              : `⏱️ Expires in: ${secondsLeft}s`}
          </p>

          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            <button onClick={handleGetQuote} disabled={loading}>
              {loading ? "Loading..." : "Refresh Quote"}
            </button>
            <button onClick={handleContinue} disabled={isExpired}>
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      <p style={{ marginTop: "20px" }}>
        <a href="/">← Back to Home</a>
      </p>
    </div>
  );
}
