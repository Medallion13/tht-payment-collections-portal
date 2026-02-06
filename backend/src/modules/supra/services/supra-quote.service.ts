import { Injectable } from '@nestjs/common';
import { QuoteResponse } from '@tht/shared';
import { LogOperation } from '../../../common/decorators/log-operation.decorator';
import { SupraQuoteByIdResponse, SupraQuoteResponse } from '../interface/supra.interfaces';
import { handleSupraError } from '../supra.errors';
import { SupraMapper } from '../supra.mapper';
import { SupraClientService } from './supra-client.service';

@Injectable()
export class SupraQuoteService {
  constructor(private readonly client: SupraClientService) {}

  @LogOperation({ name: 'getQuote' })
  async getQuote(amount: number): Promise<QuoteResponse> {
    try {
      const data = await this.client.authenticatedRequest<SupraQuoteResponse>(
        'POST',
        '/v1/exchange/quote',
        {
          initialCurrency: 'USD',
          finalCurrency: 'COP',
          initialAmount: amount,
          customExpirationTime: 60,
        },
      );

      return SupraMapper.toQuote(data);
    } catch (e) {
      throw handleSupraError(e);
    }
  }

  @LogOperation({ name: 'getQuoteById' })
  async getQuoteById(quoteId: string, orderId: string): Promise<QuoteResponse> {
    try {
      const data = await this.client.authenticatedRequest<SupraQuoteByIdResponse>(
        'GET',
        `/v1/exchange/quote/${quoteId}`,
      );

      return SupraMapper.toQuoteFromById(data, orderId);
    } catch (e) {
      throw handleSupraError(e);
    }
  }
}
