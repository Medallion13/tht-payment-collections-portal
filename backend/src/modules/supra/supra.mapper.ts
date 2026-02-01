import { addSeconds } from 'date-fns';
import { Quote, SupraQuoteResponse } from './interface/supra.interfaces';

export class SupraMapper {
  static toQuote(data: SupraQuoteResponse): Quote {
    return {
      quoteId: data.id,
      initalCurrency: data.initialCurrency,
      finalAmount: data.finalAmount,
      finalCurrency: data.finalCurrency,
      exchangeRate: data.exchangeRate,
      expiresAt: String(addSeconds(Date.now(), 45)),
    };
  }
}
