import { addSeconds } from 'date-fns';
import { Quote, SupraQuoteResponse } from './interface/supra.interfaces';

export class SupraMapper {
  static toQuote(data: SupraQuoteResponse): Quote {
    return {
      quoteId: data.id,
      finalAmount: data.finalAmount,
      exchangeRate: data.exchangeRate,
      expiresAt: addSeconds(Date.now(), 45),
    };
  }
}
