// Supra Auth responses
export interface AuthSuccess {
  token: string;
}

export interface ErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}
export type AuthResponse = AuthSuccess | ErrorResponse;

// Supra quote Responses
export interface SupraQuoteResponse {
  id: string;
  exchangeConfirmationToken: string;
  createdAt: string;
  expiresAt: string;
  initialAmount: number; // factor 100
  initialCurrency: string;
  finalAmount: number; // factor 100 with out fee
  finalCurrency: string;
  exchangeRate: number;
  inverseExchangeRate: number;
  transactionCost: number; // factor 100 - always 10 dolars
  exchangeRates: Record<string, number>;
}
export type QuoteResponse = SupraQuoteResponse | ErrorResponse;
// Internal interface for transformations
export interface Quote {
  quoteId: string;
  finalAmount: number; // factor 100
  exchangeRate: number;
  expiresAt: Date; // 45 seconds from the quote response
}
