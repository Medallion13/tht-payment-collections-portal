import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { OrderStatus } from '@tht/shared';
import { LogOperation } from '../../common/decorators/log-operation.decorator';
import { OrdersService } from '../orders/orders.service';
import { SupraBalanceService } from '../supra/services/supra-balance.service';
import { SupraPaymentService } from '../supra/services/supra-payment.service';
import { SupraQuoteService } from '../supra/services/supra-quote.service';
import { CreatePaymentRequestDto, CreatePaymentResponseDto } from './dto/payment.dto';
import { QuoteRequestDto, QuoteResponseDto } from './dto/quote.dto';
import { BalancesResponseDto, PaymentStatusResponseDto } from './dto/status.dto';
import { QuoteValidation } from './interface/payment.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly supraQuote: SupraQuoteService,
    private readonly supraPayment: SupraPaymentService,
    private readonly supraBalance: SupraBalanceService,
    private readonly ordersService: OrdersService,
  ) {}

  @LogOperation({ name: 'validateQuote' })
  private async validateQuote(
    quoteId: string,
    expectedAmountUsd: number,
    orderId: string,
  ): Promise<QuoteValidation> {
    try {
      const quote = await this.supraQuote.getQuoteById(quoteId, orderId);

      // Integrity validation
      if (quote.initialAmount !== expectedAmountUsd) {
        return {
          isValid: false,
          isExpired: false,
          totalCost: 0,
          errorMessage: `Quote amount mismatch. Expected: ${expectedAmountUsd}, Received: ${quote.initialAmount}`,
        };
      }
      // check expiration
      const now = new Date();
      const expiresAt = new Date(quote.expiresAt);
      if (now > expiresAt) {
        return {
          isValid: false,
          isExpired: true,
          totalCost: 0,
          errorMessage: 'The quote has expired',
        };
      }

      return {
        isValid: true,
        isExpired: false,
        totalCost: quote.totalCost,
      };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));

      return {
        isValid: false,
        isExpired: false,
        totalCost: 0,
        errorMessage: error.message,
      };
    }
  }

  @LogOperation({ name: 'getQuote' })
  async getQuote(dto: QuoteRequestDto): Promise<QuoteResponseDto> {
    const order = await this.ordersService.findOrderById(dto.orderId);

    if (!order) throw new NotFoundException(`Order with the ID ${dto.orderId} not found`);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`Order ${dto.orderId} is already ${order.status}`);
    }

    // Integrity validation
    if (dto.amount !== order.totalAmountUsd) {
      throw new BadRequestException(`The requested amount does not match the order total `);
    }

    const supraQuote = await this.supraQuote.getQuote(order.totalAmountUsd);

    return {
      orderId: order.id,
      quoteId: supraQuote.quoteId,
      initialAmount: dto.amount,
      finalAmount: supraQuote.finalAmount,
      transactionCost: supraQuote.transactionCost,
      exchangeRate: supraQuote.exchangeRate,
      expiresAt: supraQuote.expiresAt,
      totalCost: supraQuote.transactionCost,
    };
  }

  @LogOperation({ name: 'createPayment' })
  async createPayment(dto: CreatePaymentRequestDto): Promise<CreatePaymentResponseDto> {
    // Recover order
    const order = await this.ordersService.findOrderById(dto.orderId);
    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    // Check status of the order
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`Order ${dto.orderId} is already ${order.status}`);
    }

    // Validate the quote
    const validation = await this.validateQuote(dto.quoteId, order.totalAmountUsd, order.id);

    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid quote ID: ${validation.errorMessage || 'Quote not found'}`,
      );
    }

    if (validation.isExpired) {
      throw new BadRequestException('Quote has expired. Please request a new quote.');
    }

    // Creates supra payment resource
    const payment = await this.supraPayment.createPayment(
      {
        ...dto,
        orderId: order.id,
      },
      validation.totalCost,
    );

    return {
      userId: payment.userId,
      paymentId: payment.paymentId,
      paymentLink: payment.paymentLink,
      status: payment.status,
      quoteId: payment.quoteId,
    };
  }

  @LogOperation({ name: 'getPaymentStatus' })
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponseDto> {
    const status = await this.supraPayment.getPaymentStatus(paymentId);

    return {
      paymentId: status.paymentId,
      amount: status.amount,
      createdAt: status.createdAt,
      currency: status.currency,
      email: status.email,
      fullName: status.fullName,
      status: status.status,
    };
  }

  @LogOperation({ name: 'getBalances' })
  async getBalances(): Promise<BalancesResponseDto> {
    const balances = await this.supraBalance.getBalance();

    return {
      usd: balances.usd,
      cop: balances.cop,
    };
  }
}
