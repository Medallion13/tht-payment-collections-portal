import { Injectable, Logger } from '@nestjs/common';
import { SupraService } from '../supra/supra.service';
import { CreatePaymentResponseDto } from './dto/create-payment-response.dto';
import { CreatePaymentRequestDto } from './dto/create-payment.dto';
import { QuoteRequestDto } from './dto/quote-request.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { QuoteValidation } from './interface/payment.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly supraService: SupraService) {}

  private async validateQuote(quoteId: string): Promise<QuoteValidation> {
    const startTime = Date.now();
    let result: QuoteValidation | null = null;
    let error: Error | null = null;

    try {
      const quote = await this.supraService.getQuoteById(quoteId);

      // check expiration
      const now = new Date();
      const expiresAt = new Date(quote.expiresAt);
      const isExpired = now > expiresAt;

      // Get the total cost
      const totalCost = quote.finalAmount + quote.transactionCost;

      result = {
        isValid: true,
        isExpired,
        totalCost,
      };

      return result;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));

      result = {
        isValid: false,
        isExpired: false,
        totalCost: 0,
        errorMessage: error.message,
      };

      return result;
    } finally {
      this.logger.log('validate_quote', {
        operation: 'PaymentService',
        input: { quoteId },
        output: result
          ? {
              isValid: result.isValid,
              isExpired: result.isExpired,
              totalCost: result.totalCost,
            }
          : null,
        duration_ms: Date.now() - startTime,
        status: error ? 'error' : 'success',
        error: error ? { message: error.message } : null,
      });
    }
  }

  async getQuote(dto: QuoteRequestDto): Promise<QuoteResponseDto> {
    const startTime = Date.now();
    let error: Error | null = null;
    let result: QuoteResponseDto | null = null;

    try {
      const supraQuote = await this.supraService.getQuote(dto.amount);

      result = {
        quoteId: supraQuote.quoteId,
        initialAmount: dto.amount,
        finalAmount: supraQuote.finalAmount,
        transactionCost: supraQuote.transactionCost,
        exchangeRate: supraQuote.exchangeRate,
        expiresAt: supraQuote.expiresAt,
        totalCost: supraQuote.transactionCost + supraQuote.finalAmount,
      };

      return result;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));

      throw error;
    } finally {
      this.logger.log({
        operation: 'getQuote',
        input: { initialAmount: dto.amount },
        output: result
          ? {
              quoteId: result.quoteId,
              initialAmout: result.initialAmount,
              finalAmount: result.finalAmount,
            }
          : null,
        duration: Date.now() - startTime,
        status: error ? 'error' : 'success',
        error: error ? { message: error.message } : null,
      });
    }
  }

  async createPayment(dto: CreatePaymentRequestDto): Promise<CreatePaymentResponseDto> {
    const startTime = Date.now();
    let result: CreatePaymentResponseDto | null = null;
    let error: Error | null = null;

    try {
      // Validate the quote
      const validation = await this.validateQuote(dto.quoteId);

      if (!validation.isValid) {
        throw new Error(`Invalid quote ID: ${validation.errorMessage || 'Quote not found'}`);
      }

      if (validation.isExpired) {
        throw new Error('Quote has expired. Please request a new quote.');
      }

      // Create payment
      const payment = await this.supraService.createPayment(dto.quoteId, validation.totalCost, {
        fullName: dto.fullName,
        documentType: dto.documentType,
        document: dto.document,
        email: dto.email,
        cellPhone: dto.cellPhone,
      });

      // Build response for the API
      result = {
        userId: payment.userId,
        paymentId: payment.paymentId,
        paymentLink: payment.paymentLink,
        status: payment.status,
        quoteId: payment.quoteId,
      };

      return result;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      throw error;
    } finally {
      this.logger.log('create_payment', {
        operation: 'createPayment',
        input: {
          quoteId: dto.quoteId,
          email: dto.email,
          fullName: dto.fullName,
        },
        output: result
          ? {
              paymentId: result.paymentId,
              status: result.status,
            }
          : null,
        duration_ms: Date.now() - startTime,
        status: error ? 'error' : 'success',
        error: error ? { message: error.message } : null,
      });
    }
  }
}
