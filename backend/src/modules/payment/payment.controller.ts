import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { BalancesResponseDTO } from './dto/balances-response.dto';
import { CreatePaymentResponseDto } from './dto/create-payment-response.dto';
import { CreatePaymentRequestDto } from './dto/create-payment.dto';
import { PaymentStatusResponseDto } from './dto/payment-status-response.dto';
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
      // for 500 errors
      // TODO CHECK ERROR MANAGEment
      console.error(e);
      if (e instanceof Error && e.name == 'NotFoundError') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Get('balances')
  async getBalances(): Promise<BalancesResponseDTO> {
    return this.paymentService.getBalances();
  }
}
