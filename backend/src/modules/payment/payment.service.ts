import { Injectable, Logger } from '@nestjs/common';
import { SupraService } from '../supra/supra.service';
import { QuoteRequestDto } from './dto/quote-request.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly supraService: SupraService) {}

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
        exchangeRate: supraQuote.exchangeRate,
        expiresAt: supraQuote.expiresAt,
      };

      return result;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));

      throw error;
    } finally {
      this.logger.log({
        operation: 'getQuote',
        input: { initialAmount: dto.amount },
        output: result ? { quoteId: result.quoteId, initialAmout: result.initialAmount } : null,
        duration: Date.now() - startTime,
        status: error ? 'error' : 'success',
        error: error ? { message: error.message } : null,
      });
    }
  }
}
