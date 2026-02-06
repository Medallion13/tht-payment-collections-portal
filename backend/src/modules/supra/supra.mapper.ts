import {
  AppBalance,
  CreatePaymentResponse,
  PaymentStatusResponse,
  QuoteResponse,
  type PaymentStatus,
} from '@tht/shared';

import { addSeconds } from 'date-fns';
import {
  SupraBalanceResponse,
  SupraPaymentCreateResponse,
  SupraPaymentStatusResponse,
  SupraQuoteByIdResponse,
  SupraQuoteResponse,
} from './interface/supra.interfaces';

import { TRANSACTION_COST_USD } from './supra.constants';

export class SupraMapper {
  static toQuote(data: SupraQuoteResponse): QuoteResponse {
    const txCost = TRANSACTION_COST_USD * data.exchangeRate;
    const total = data.initialAmount + txCost;
    return {
      orderId: '',
      quoteId: data.id,
      initialAmount: data.initialAmount,
      finalAmount: data.finalAmount,
      transactionCost: TRANSACTION_COST_USD * data.exchangeRate,
      exchangeRate: data.exchangeRate,
      expiresAt: addSeconds(new Date(), 45).toISOString(),
      totalCost: total,
    };
  }

  static toQuoteFromById(data: SupraQuoteByIdResponse, orderId: string): QuoteResponse {
    const finalAmt =
      typeof data.finalAmount === 'string' ? parseInt(data.finalAmount, 10) : data.finalAmount;
    const initalAmt =
      typeof data.initialAmount === 'string'
        ? parseInt(data.initialAmount, 10)
        : data.initialAmount;

    const txCost = TRANSACTION_COST_USD * data.exchangeRate;
    const total = finalAmt + txCost;

    return {
      orderId: orderId,
      quoteId: data.id,
      initialAmount: initalAmt,
      finalAmount: finalAmt,
      transactionCost: TRANSACTION_COST_USD * data.exchangeRate,
      exchangeRate: data.exchangeRate,
      expiresAt: data.expiresAt,
      totalCost: total,
    };
  }

  static toPayment(data: SupraPaymentCreateResponse): CreatePaymentResponse {
    return {
      userId: data.userId,
      paymentId: data.id,
      paymentLink: data.paymentLink,
      status: data.status as PaymentStatus,
      quoteId: data.quoteId,
    };
  }

  static toPaymentStatus(data: SupraPaymentStatusResponse): PaymentStatusResponse {
    return {
      paymentId: data.id,
      status: data.status as PaymentStatus,
      amount: data.amount,
      currency: data.currency,
      fullName: data.fullName,
      email: data.email,
      createdAt: data.createdAt,
    };
  }

  static toBalances(data: SupraBalanceResponse): AppBalance {
    const findAmount = (currency: string): number => {
      const item = data.find((b) => b.currency.toLowerCase() == currency);
      return item?.amount ?? 0;
    };

    return {
      usd: findAmount('usd'),
      cop: findAmount('cop'),
    };
  }
}
