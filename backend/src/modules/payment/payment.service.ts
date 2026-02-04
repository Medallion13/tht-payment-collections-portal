import { Injectable, Logger } from '@nestjs/common';
import { SupraService } from '../supra/supra.service';

import { LogOperation } from '../../common/decorators/log-operation.decorator';
import { CreatePaymentRequestDto, CreatePaymentResponseDto } from './dto/payment.dto';
import { QuoteRequestDto, QuoteResponseDto } from './dto/quote.dto';
import { BalancesResponseDto, PaymentStatusResponseDto } from './dto/status.dto';
import { QuoteValidation } from './interface/payment.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly supraService: SupraService) {}

  @LogOperation({ name: 'validateQuote' })
  private async validateQuote(quoteId: string): Promise<QuoteValidation> {
    try {
      const quote = await this.supraService.getQuoteById(quoteId);

      // check expiration
      const now = new Date();
      const expiresAt = new Date(quote.expiresAt);
      const isExpired = now > expiresAt;

      // Get the total cost
      const totalCost = quote.finalAmount + quote.transactionCost;

      return {
        isValid: true,
        isExpired,
        totalCost,
      };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));

      return {
        isValid: false,
        isExpired: false,
        totalCost: 0,
        errorMessage: error.message,
      };
    }
  }

  @LogOperation({ name: 'getQuote' })
  async getQuote(dto: QuoteRequestDto): Promise<QuoteResponseDto> {
    const supraQuote = await this.supraService.getQuote(dto.amount);

    return {
      quoteId: supraQuote.quoteId,
      initialAmount: dto.amount,
      finalAmount: supraQuote.finalAmount,
      transactionCost: supraQuote.transactionCost,
      exchangeRate: supraQuote.exchangeRate,
      expiresAt: supraQuote.expiresAt,
      totalCost: supraQuote.transactionCost + supraQuote.finalAmount,
    };
  }

  @LogOperation({ name: 'createPayment' })
  async createPayment(dto: CreatePaymentRequestDto): Promise<CreatePaymentResponseDto> {
    // Validate the quote
    const validation = await this.validateQuote(dto.quoteId);

    if (!validation.isValid) {
      throw new Error(`Invalid quote ID: ${validation.errorMessage || 'Quote not found'}`);
    }

    if (validation.isExpired) {
      throw new Error('Quote has expired. Please request a new quote.');
    }

    // Create payment
    const payment = await this.supraService.createPayment(
      {
        fullName: dto.fullName,
        documentType: dto.documentType,
        document: dto.document,
        email: dto.email,
        cellPhone: dto.cellPhone,
        quoteId: dto.quoteId,
      },
      validation.totalCost,
    );

    // Build response for the API
    return {
      userId: payment.userId,
      paymentId: payment.paymentId,
      paymentLink: payment.paymentLink,
      status: payment.status,
      quoteId: payment.quoteId,
    };
  }

  @LogOperation({ name: 'getPaymentStatus' })
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponseDto> {
    const status = await this.supraService.getPaymentStatus(paymentId);

    return {
      paymentId: status.paymentId,
      amount: status.amount,
      createdAt: status.createdAt,
      currency: status.currency,
      email: status.email,
      fullName: status.fullName,
      status: status.status,
    };
  }

  @LogOperation({ name: 'getBalances' })
  async getBalances(): Promise<BalancesResponseDto> {
    const balances = await this.supraService.getBalance();

    return {
      usd: balances.usd,
      cop: balances.cop,
    };
  }
}
