import { addSeconds } from 'date-fns';
import {
  Payment,
  Quote,
  SupraPaymentCreateResponse,
  SupraQuoteByIdResponse,
  SupraQuoteResponse,
} from './interface/supra.interfaces';
import { TRANSACTION_COST_USD } from './supra.constants';

export class SupraMapper {
  static toQuote(data: SupraQuoteResponse): Quote {
    return {
      quoteId: data.id,
      initialCurrency: data.initialCurrency,
      finalAmount: data.finalAmount,
      transactionCost: data.transactionCost,
      finalCurrency: data.finalCurrency,
      exchangeRate: data.exchangeRate,
      expiresAt: addSeconds(new Date(), 45).toISOString(),
    };
  }

  static toQuoteFromById(data: SupraQuoteByIdResponse): Quote {
    return {
      quoteId: data.id,
      initialCurrency: data.initialCurrency,
      finalAmount: parseInt(data.finalAmount, 10),
      transactionCost: TRANSACTION_COST_USD,
      finalCurrency: data.finalCurrency,
      exchangeRate: data.exchangeRate,
      expiresAt: data.expiresAt,
    };
  }

  static toPayment(data: SupraPaymentCreateResponse): Payment {
    return {
      userId: data.userId,
      paymentId: data.id,
      paymentLink: data.paymentLink,
      status: data.status,
      quoteId: data.quoteId,
    };
  }
}
