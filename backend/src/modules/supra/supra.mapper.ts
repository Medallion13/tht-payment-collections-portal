import { addSeconds } from 'date-fns';
import { Quote, SupraQuoteResponse } from './interface/supra.interfaces';

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
}
