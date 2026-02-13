import { Body, Controller, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { LogOperation } from '../../common/decorators/log-operation.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Post()
  @LogOperation({ name: 'create_order_endpoint', logInput: true, logOutput: false })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('x-mock-balance') mockBalance?: string,
  ) {
    // Create the base order
    const order = await this.orderService.initializeOrder(createOrderDto);
    // try to process the payment inmediately and mock the balance if is define
    const balanceValue = mockBalance ? parseFloat(mockBalance) : undefined;

    return this.orderService.processPaymentAttempt(order.id, balanceValue);
  }

  // Retry of the payment
  @Post(':id/retry')
  @LogOperation({ name: 'retry_payment_endpoint' })
  async retryPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-mock-balance') mockBalance?: string,
  ) {
    const balanceValue = mockBalance ? parseFloat(mockBalance) : undefined;
    return this.orderService.processPaymentAttempt(id, balanceValue);
  }

  // finalize the order
  @Post(':orderId/finalize')
  @LogOperation({ name: 'finalize_order_endpoint' })
  async finalizeOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.orderService.finalizeOrder(orderId);
  }
}
