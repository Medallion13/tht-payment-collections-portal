export class QuoteResponseDto {
  quoteId: string;
  initialAmount: number;
  finalAmount: number;
  transactionCost: number;
  exchangeRate: number;
  expiresAt: string;
  totalCost: number;
}
