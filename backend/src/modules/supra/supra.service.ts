import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import {
  AuthResponse,
  Balances,
  ErrorResponse,
  Payment,
  PaymentStatus,
  Quote,
  QuoteResponse,
  SupraBalanceResponse,
  SupraPaymentCreateRequest,
  SupraPaymentCreateResponse,
  SupraPaymentStatusResponse,
  SupraQuoteByIdResponse,
} from './interface/supra.interfaces';
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
        this.httpService.post<AuthResponse>(
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

      const data = response.data;

      if ('token' in data) {
        return data.token;
      }

      throw new Error(`Error getting the token: ${JSON.stringify(data)} `);
    } catch (e) {
      if (e instanceof AxiosError && e.response?.data) {
        const serverError = e.response.data as ErrorResponse;
        error = new Error(`Supra API Error: ${serverError.message || e.message}`);
      } else {
        error = e instanceof Error ? e : new Error(String(e));
      }
      throw e;
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
  async getQuote(amount: number): Promise<Quote> {
    const startTime = Date.now();
    let error: Error | null = null;
    let result: Quote | null = null;
    try {
      const token = await this.getToken();
      const amountForApi = amount;

      const response = await firstValueFrom(
        this.httpService.post<QuoteResponse>(
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
      const data = response.data;
      if ('id' in data) {
        result = SupraMapper.toQuote(data);
        return result;
      }

      throw new Error(`Error creating the quote: ${JSON.stringify(data)}`);
    } catch (e) {
      if (e instanceof AxiosError && e.response?.data) {
        const serverError = e.response.data as ErrorResponse;
        error = new Error(`Supra API Error: ${serverError.message || e.message}`);
      } else {
        error = e instanceof Error ? e : new Error(String(e));
      }
      throw e;
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
  async getQuoteById(quoteId: string): Promise<Quote> {
    const startTime = Date.now();
    let result: Quote | null = null;
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
      const data = response.data;
      if ('id' in data) {
        result = SupraMapper.toQuoteFromById(data);
        return result;
      }

      throw new Error(`Error getting the create quote: ${JSON.stringify(data)}`);
    } catch (e) {
      if (e instanceof AxiosError && e.response?.data) {
        const serverError = e.response.data as ErrorResponse;
        error = new Error(`Supra API Error: ${serverError.message || e.message}`);
      } else {
        error = e instanceof Error ? e : new Error(String(e));
      }
      throw e;
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
    quoteId: string,
    totalCost: number,
    userData: {
      fullName: string;
      documentType: string;
      document: string;
      email: string;
      cellPhone: string;
    },
  ): Promise<Payment> {
    const startTime = Date.now();
    let result: Payment | null = null;
    let error: Error | null = null;

    try {
      const token = await this.getToken();

      // Construct Supra request
      const paymentRequest: SupraPaymentCreateRequest = {
        currency: 'COP',
        amount: totalCost,
        referenceId: randomUUID(),
        documentType: userData.documentType,
        email: userData.email,
        cellPhone: userData.cellPhone,
        document: userData.document,
        fullName: userData.fullName,
        description: 'Collection Payment',
        redirectUrl: 'http://localhost:5173/confirmation',
        quoteId,
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

      const data = response.data;

      if ('id' in data) {
        result = SupraMapper.toPayment(data);
        return result;
      }

      throw new Error(`Error creating payment: ${JSON.stringify(data)}`);
    } catch (e) {
      if (e instanceof AxiosError && e.response?.data) {
        const serverError = e.response.data as ErrorResponse;
        console.error(e);
        error = new Error(`Supra API Error: ${serverError.message || e.message}`);
      } else {
        error = e instanceof Error ? e : new Error(String(e));
      }
      throw error;
    } finally {
      this.logger.log('create_payment', {
        operation: `createPayment`,
        input: {
          quoteId,
          email: userData.email,
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
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const startTime = Date.now();
    let error: Error | null = null;
    let result: PaymentStatus | null = null;

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

      const data = response.data;

      if ('id' in data) {
        result = SupraMapper.toPaymentStatus(data);
        return result;
      }

      throw new Error(`Error getting payment status: ${JSON.stringify(data)}`);
    } catch (e) {
      if (e instanceof AxiosError && e.response?.data) {
        const serverError = e.response.data as ErrorResponse;
        error = new Error(`Supra API Error: ${serverError.message || e.message}`);
      } else {
        error = e instanceof Error ? e : new Error(String(e));
      }
      throw e;
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

  async getBalance(): Promise<Balances> {
    const startTime = Date.now();
    let error: Error | null = null;
    let result: Balances | null = null;

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
      if (e instanceof AxiosError && e.response?.data) {
        const serverError = e.response.data as ErrorResponse;
        error = new Error(`Supra API Error: ${serverError.message || e.message}`);
      } else {
        error = e instanceof Error ? e : new Error(String(e));
      }
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
