import { Body, Controller, Post } from '@nestjs/common';
import { LogOperation } from '../../common/decorators/log-operation.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './ordes.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Post()
  @LogOperation({ name: 'create_order_endpoint', logInput: true, logOutput: false })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.initializeOrder(createOrderDto);
  }
}
