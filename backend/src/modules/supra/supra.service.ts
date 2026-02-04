import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppBalance,
  type CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  QuoteResponse,
} from '@tht/shared';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';

import { LogOperation } from '../../common/decorators/log-operation.decorator';
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

  @LogOperation({ name: 'getToken', logOutput: false })
  private async getToken(): Promise<string> {
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
      throw handleSupraError(e);
    }
  }

  /**
   * Get exchange rate quote
   */
  @LogOperation({ name: 'getQuote' })
  async getQuote(amount: number): Promise<QuoteResponse> {
    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.post<SupraQuoteResponse>(
          `${this.apiUrl}/v1/exchange/quote`,
          {
            initialCurrency: 'USD',
            finalCurrency: 'COP',
            initialAmount: amount,
            customExpirationTime: 60,
          },
          {
            headers: { Authorization: `Bearer ${token}`, 'X-API-TYPE': 'public' },
          },
        ),
      );

      return SupraMapper.toQuote(response.data);
    } catch (e) {
      throw handleSupraError(e);
    }
  }

  /**
   * Get the Quote by ID for validation before creating the payment
   */
  @LogOperation({ name: 'getQuoteById' })
  async getQuoteById(quoteId: string): Promise<QuoteResponse> {
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
      return SupraMapper.toQuoteFromById(response.data);
    } catch (e) {
      throw handleSupraError(e);
    }
  }

  /**
   * Create the payment
   */
  @LogOperation({ name: 'createPayment' })
  async createPayment(
    paymentData: CreatePaymentRequest,
    totalCost: number,
  ): Promise<CreatePaymentResponse> {
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

      return SupraMapper.toPayment(response.data);
    } catch (e) {
      throw handleSupraError(e);
    }
  }

  /**
   * Get the payment by id
   */
  @LogOperation({ name: 'getPaymentStatus' })
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

  @LogOperation({ name: 'getBalance' })
  async getBalance(): Promise<AppBalance> {
    try {
      const token = await this.getToken();

      const response = await firstValueFrom(
        this.httpService.get<SupraBalanceResponse>(`${this.apiUrl}/v1/payout/user/balances`, {
          headers: { Authorization: `Bearer ${token}`, 'X-API-TYPE': 'public' },
        }),
      );

      const data = response.data;

      if (Array.isArray(data)) {
        return SupraMapper.toBalances(data);
      }

      throw new Error(`Error getting balances: ${JSON.stringify(data)}`);
    } catch (e) {
      throw handleSupraError(e);
    }
  }
}
