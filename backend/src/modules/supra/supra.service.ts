import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppBalance,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  QuoteResponse,
} from '@tht/shared';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';

import {
  AuthSuccess,
  SupraBalanceResponse,
  SupraPaymentCreateRequest,
  SupraPaymentCreateResponse,
  SupraPaymentStatusResponse,
  SupraQuoteByIdResponse,
  SupraQuoteResponse,
} from './interface/supra.interfaces';
import { handleSupraError } from './supra.errors';
import { SupraMapper } from './supra.mapper';

@Injectable()
export class SupraService {
  private readonly logger = new Logger(SupraService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // Get env variables
  private get apiUrl(): string {
    return this.configService.getOrThrow<string>('supra.apiUrl');
  }

  private get clientId(): string {
    return this.configService.getOrThrow<string>('supra.clientId');
  }

  private get secret(): string {
    return this.configService.getOrThrow<string>('supra.secret');
  }

  private async getToken(): Promise<string> {
    const startTime = Date.now();
    let error: Error | null = null;

    try {
      const response = await firstValueFrom(
        this.httpService.post<AuthSuccess>(
          `${this.apiUrl}/v1/auth/token`,
          {
            clientId: this.clientId,
            clientSecret: this.secret,
          },
          {
            headers: { 'X-API-TYPE': 'public' },
          },
        ),
      );

      return response.data.token;
    } catch (e) {
      error = handleSupraError(e);
      throw error;
    } finally {
      this.logger.log({
        operation: 'getToken',
        duration_ms: Date.now() - startTime,
        status: error ? 'error' : 'success',
        error: error ? { message: error.message } : null,
      });
    }
  }

  /**
   * Get exchange rate quote
   */
  async getQuote(amount: number): Promise<QuoteResponse> {
    const startTime = Date.now();
    let error: Error | null = null;
    let result: QuoteResponse | null = null;

    try {
      const token = await this.getToken();
      const amountForApi = amount;

      const response = await firstValueFrom(
        this.httpService.post<SupraQuoteResponse>(
          `${this.apiUrl}/v1/exchange/quote`,
          {
            initialCurrency: 'USD',
            finalCurrency: 'COP',
            initialAmount: amountForApi,
            customExpirationTime: 60,
          },
          {
            headers: { Authorization: `Bearer ${token}`, 'X-API-TYPE': 'public' },
          },
        ),
      );

      result = SupraMapper.toQuote(response.data);

      return result;
    } catch (e) {
      error = handleSupraError(e);
      throw error;
    } finally {
      this.logger.log({
        operation: 'getSupraQuote',
        input: { amount },
        output: result ? { quoteId: result.quoteId, finalAmount: result.finalAmount } : null,
        duration_ms: Date.now() - startTime,
        status: error ? 'error' : 'success',
        error: error ? { message: error.message } : null,
      });
    }
  }

  /**
   * Get the Quote by ID for validation before creating the payment
   */
  async getQuoteById(quoteId: string): Promise<QuoteResponse> {
    const startTime = Date.now();
    let result: QuoteResponse | null = null;
    let error: Error | null = null;

    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.get<SupraQuoteByIdResponse>(
          `${this.apiUrl}/v1/exchange/quote/${quoteId}`,
          {
            headers: {
              'X-API-TYPE': 'public',
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );
      result = SupraMapper.toQuoteFromById(response.data);
      return result;
    } catch (e) {
      error = handleSupraError(e);

      throw error;
    } finally {
      this.logger.log('get_quote_by_id', {
        operation: 'getQuoteById',
        input: { quoteId },
        output: result
          ? {
              exists: true,
              finalAmount: result.finalAmount,
              expiresAt: result.expiresAt,
            }
          : null,
        duration_ms: Date.now() - startTime,
        status: error ? 'error' : 'success',
        error: error ? { message: error.message } : null,
      });
    }
  }

  /**
   * Create the payment
   */
  async createPayment(
    paymentData: CreatePaymentRequest,
    totalCost: number,
  ): Promise<CreatePaymentResponse> {
    const startTime = Date.now();
    let result: CreatePaymentResponse | null = null;
    let error: Error | null = null;

    try {
      const token = await this.getToken();

      // Construct Supra request
      const paymentRequest: SupraPaymentCreateRequest = {
        currency: 'COP',
        amount: totalCost,
        referenceId: randomUUID(),
        documentType: paymentData.documentType,
        email: paymentData.email,
        cellPhone: paymentData.cellPhone,
        document: paymentData.document,
        fullName: paymentData.fullName,
        description: 'Collection Payment',
        redirectUrl: 'http://localhost:5173/confirmation',
        quoteId: paymentData.quoteId,
      };

      const response = await firstValueFrom(
        this.httpService.post<SupraPaymentCreateResponse>(
          `${this.apiUrl}/v1/payin/payment`,
          paymentRequest,
          {
            headers: {
              'X-API-TYPE': 'public',
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      result = SupraMapper.toPayment(response.data);

      return result;
    } catch (e) {
      error = handleSupraError(e);
      throw error;
    } finally {
      this.logger.log('create_payment', {
        operation: `createPayment`,
        input: {
          quoteId: paymentData.quoteId,
          email: paymentData.email,
          amount: totalCost,
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

  /**
   * Get the payment by id
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    const startTime = Date.now();
    let error: Error | null = null;
    let result: PaymentStatusResponse | null = null;

    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.get<SupraPaymentStatusResponse>(
          `${this.apiUrl}/v1/payin/payment/${paymentId}`,
          {
            headers: { Authorization: `Bearer ${token}`, 'X-API-TYPE': 'public' },
          },
        ),
      );

      result = SupraMapper.toPaymentStatus(response.data);

      return result;
    } catch (e) {
      error = handleSupraError(e, { notFoundOn500: true });
      throw error;
    } finally {
      this.logger.log({
        operation: 'getPaymentStatus',
        input: { paymentId },
        output: result
          ? {
              status: result.status,
              amount: result.amount,
            }
          : null,
        duration_ms: Date.now() - startTime,
        status: error ? 'error' : 'success',
        error: error ? { message: error.message } : null,
      });
    }
  }

  async getBalance(): Promise<AppBalance> {
    const startTime = Date.now();
    let error: Error | null = null;
    let result: AppBalance | null = null;

    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.get<SupraBalanceResponse>(`${this.apiUrl}/v1/payout/user/balances`, {
          headers: { Authorization: `Bearer ${token}`, 'X-API-TYPE': 'public' },
        }),
      );

      const data = response.data;

      if (Array.isArray(data)) {
        result = SupraMapper.toBalances(data);
        return result;
      }

      throw new Error(`Error getting balances: ${JSON.stringify(data)}`);
    } catch (e) {
      error = handleSupraError(e);
      throw e;
    } finally {
      this.logger.log({
        operation: 'getPaymentStatus',

        duration_ms: Date.now() - startTime,
        status: error ? 'error' : 'success',
        error: error ? { message: error.message } : null,
      });
    }
  }
}
