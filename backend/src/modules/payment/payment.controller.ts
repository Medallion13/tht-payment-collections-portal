import { Body, Controller, Post } from '@nestjs/common';
import { QuoteRequestDto } from './dto/quote-request.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { PaymentService } from './payment.service';

@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('quote')
  async getQuote(@Body() dto: QuoteRequestDto): Promise<QuoteResponseDto> {
    return this.paymentService.getQuote(dto);
  }
}
