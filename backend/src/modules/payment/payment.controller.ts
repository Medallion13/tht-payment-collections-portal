import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { CreatePaymentRequestDto, CreatePaymentResponseDto } from './dto/payment.dto';
import { QuoteRequestDto, QuoteResponseDto } from './dto/quote.dto';
import { BalancesResponseDto, PaymentStatusResponseDto } from './dto/status.dto';
import { PaymentService } from './payment.service';

@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('quote')
  async getQuote(@Body() dto: QuoteRequestDto): Promise<QuoteResponseDto> {
    return this.paymentService.getQuote(dto);
  }

  @Post('process')
  @HttpCode(200)
  async createPayment(@Body() dto: CreatePaymentRequestDto): Promise<CreatePaymentResponseDto> {
    return this.paymentService.createPayment(dto);
  }

  @Get('status/:id')
  async getPaymentStatus(@Param('id') id: string): Promise<PaymentStatusResponseDto> {
    try {
      return await this.paymentService.getPaymentStatus(id);
    } catch (e) {
      // for not found errors
      if (e instanceof Error && e.name == 'NotFoundError') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Get('balances')
  async getBalances(): Promise<BalancesResponseDto> {
    return this.paymentService.getBalances();
  }
}
