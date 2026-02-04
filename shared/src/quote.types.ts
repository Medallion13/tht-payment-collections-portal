export interface QuoteRequest {
  /**
   * amount to be quoted
   * Be in factor 100
   */
  amount: number;
}

export interface QuoteResponse {
  quoteId: string;
  initialAmount: number; // factor 100
  finalAmount: number; //factor 100
  transactionCost: number;
  exchangeRate: number;
  expiresAt: string;
  totalCost: number; // factor 100
}
