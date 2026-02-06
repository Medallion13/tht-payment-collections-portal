import { QuoteRequest, QuoteResponse } from '@tht/shared';
import { IsNotEmpty, IsNumber, IsPositive, IsUUID, Min } from 'class-validator';

/** Minimum amount in factor 100 ($15.00 USD) */
const MIN_AMOUNT_USD = 1500;

export class QuoteRequestDto implements QuoteRequest {
  @IsUUID('4', { message: 'orderId must be a valid UUID v4' })
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @IsPositive()
  @Min(MIN_AMOUNT_USD, {
    message: `Minimum amount is $15.00 USD (received: $${MIN_AMOUNT_USD / 100})`,
  })
  amount: number;
}
export class QuoteResponseDto implements QuoteResponse {
  orderId: string;
  quoteId: string;
  initialAmount: number; // factor 100
  finalAmount: number; // factor 100
  transactionCost: number; // factor 100
  exchangeRate: number;
  expiresAt: string;
  totalCost: number;
}
