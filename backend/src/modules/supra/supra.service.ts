import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, ErrorResponse, Quote, QuoteResponse } from './interface/supra.interfaces';
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
        this.httpService.post<AuthResponse>(`${this.apiUrl}/v1/auth/token`, {
          clientId: this.clientId,
          clientSecret: this.secret,
        }),
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
        error: error ? { message: error.message, stack: error.stack } : null,
      });
    }
  }

  async getQuote(amount: number): Promise<Quote> {
    const startTime = Date.now();
    let error: Error | null = null;
    let result: Quote | null = null;
    try {
      const token = await this.getToken();
      const amountForApi = Math.round(amount * 100); // factor 100

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
            headers: { Authorization: `Bearer ${token}` },
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
}
