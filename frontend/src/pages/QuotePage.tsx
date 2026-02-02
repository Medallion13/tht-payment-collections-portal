import { useEffect, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import "../styles/QuotePage.css";

// TODO check de herramientas que permiten compartir los modelos en monorepos para mantener consistencia de datos

const countryCodes = [
  { code: "+57", label: "🇨🇴 +57" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+52", label: "🇲🇽 +52" },
];
interface QuoteResponse {
  quoteId: string;
  initialAmount: number;
  finalAmount: number;
  transactionCost: number;
  totalCost: number;
  exchangeRate: number;
  expiresAt: string;
}

interface FormData {
  fullName: string;
  documentType: string;
  document: string;
  email: string;
  cellPhone: string;
}

export default function QuotePage() {
  const [searchParams] = useSearchParams();

  //get the amount form the URL o pass a default value for testing reasons
  const initialAmount = parseFloat(searchParams.get("amount") || "0");

  // Quote state
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  //cellphone state
  const [phonePrefix, setPhonePrefix] = useState("+57");

  // Form State
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    documentType: "CC",
    document: "",
    email: "",
    cellPhone: "",
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpired = secondsLeft === 0 && quote !== null;
  const isInvalidAmount = initialAmount <= 0;

  // First quote with render
  // useEffect(() => {
  //   if (!isInvalidAmount) {
  //     handleGetQuote();
  //   }
  // }, []);

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

  const handleGetQuote = async () => {
    if (isInvalidAmount) {
      setError("Invalid amount.");
      return;
    }

    setLoadingQuote(true);
    setError(null);

    try {
      const data = await api.getQuote(initialAmount);
      setQuote(data);
    } catch (e) {
      setError("error getting quote. Try Again.");
      console.error(e);
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    if (!quote) {
      setError("Please get a quote first.");
      return;
    }

    if (isExpired) {
      setError("Quote expired. Please refresh quote.");
      return;
    }

    setLoadingSubmit(true);
    setError(null);

    try {
      const response = await api.createPayment({
        quoteId: quote.quoteId,
        ...formData,
      });

      // Save to localStorage for confirmation page
      localStorage.setItem("pendingPaymentId", response.paymentId);

      // Redirect to Supra
      window.location.href = response.paymentLink;
    } catch (e: any) {
      setError(e.message || "Error creating payment. Try again.");
      console.error(e);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const formatMoney = (value: number, decimals: number = 2): string => {
    return (value / 100).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const handlePhoneChange = (localNumber: string) => {
    setFormData({ ...formData, cellPhone: `${phonePrefix}${localNumber}` });
  };

  const handlePrefixChange = (newPrefix: string) => {
    setPhonePrefix(newPrefix);
    const currentLocal = formData.cellPhone.replace(phonePrefix, "");
    setFormData({ ...formData, cellPhone: `${newPrefix}${currentLocal}` });
  };

  if (isInvalidAmount) {
    return (
      <div className="container">
        <h1>Invalid Amount</h1>
        <p className="error">
          No valid amount: <code>?amount=number</code>
        </p>
        <Link to="/">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Payment Portal - ${initialAmount} USD</h1>

      {error && <div className="error-banner">{error}</div>}

      <div className="main-grid">
        {/* Left: Form Section */}
        <div className="form-section">
          <h2>Your Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label>Document Type *</label>
              <select
                value={formData.documentType}
                onChange={(e) =>
                  setFormData({ ...formData, documentType: e.target.value })
                }
                required
              >
                <option value="CC">CC - Cédula de Ciudadanía</option>
                <option value="NIT">NIT - Número de Identificación</option>
                <option value="CE">CE - Cédula de Extranjería</option>
                <option value="PA">PA - Pasaporte</option>
              </select>
            </div>

            <div className="form-group">
              <label>Document Number *</label>
              <input
                type="text"
                value={formData.document}
                onChange={(e) =>
                  setFormData({ ...formData, document: e.target.value })
                }
                required
                placeholder="123456789"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                placeholder="email@example.com"
              />
            </div>
            <div className="form-group">
              <label>Cell Phone *</label>

              {/* Usamos un div con flex para ponerlos lado a lado */}
              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  style={{ width: "110px" }}
                  value={phonePrefix} // Variable de estado: "+57", "+1", etc.
                  onChange={(e) => handlePrefixChange(e.target.value)}
                >
                  {countryCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  style={{ flex: 1 }} // Ocupa el espacio restante
                  value={formData.cellPhone.replace(phonePrefix, "")}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  required
                  placeholder="3001234567"
                  maxLength={10}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loadingSubmit || isExpired || !quote}
            >
              {loadingSubmit ? "Processing..." : "💳 Proceed to Payment"}
            </button>
          </form>
        </div>

        {/* Right: Quote Section */}
        <div className="quote-section">
          <h2>Quote Information</h2>

          {!quote ? (
            <div className="quote-empty">
              <p>Get a quote to see payment details</p>
              <button
                onClick={handleGetQuote}
                disabled={loadingQuote}
                className="btn-quote"
              >
                {loadingQuote ? "Loading..." : "Get Quote"}
              </button>
            </div>
          ) : (
            <div className={`quote-card ${isExpired ? "expired" : ""}`}>
              <div className="quote-detail">
                <span>Exchange Rate:</span>
                <strong>${formatMoney(quote.exchangeRate * 100)} COP</strong>
              </div>

              <div className="quote-detail">
                <span>Converted Amount:</span>
                <strong>${formatMoney(quote.finalAmount)} COP</strong>
              </div>

              <div className="quote-detail">
                <span>Transaction Fee:</span>
                <strong>${formatMoney(quote.transactionCost)} COP</strong>
              </div>

              <div className="quote-detail total">
                <span>Total to Pay:</span>
                <strong>${formatMoney(quote.totalCost)} COP</strong>
              </div>

              <div
                className={`timer ${isExpired ? "expired" : secondsLeft <= 10 ? "warning" : ""}`}
              >
                {isExpired
                  ? "⚠️ Quote Expired"
                  : `⏱️ Expires in: ${secondsLeft}s`}
              </div>

              <button
                onClick={handleGetQuote}
                disabled={loadingQuote}
                className="btn-refresh"
              >
                {loadingQuote ? "Refreshing..." : "🔄 Refresh Quote"}
              </button>

              {isExpired && (
                <p className="expired-warning">
                  Please refresh quote to continue
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="footer">
        <a href="/">← Back to Home</a>
      </div>
    </div>
  );
}
