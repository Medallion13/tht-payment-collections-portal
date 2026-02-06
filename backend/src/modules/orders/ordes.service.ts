import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderStatus } from '@tht/shared';
import { Repository } from 'typeorm';
import { LogOperation } from '../../common/decorators/log-operation.decorator';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  @LogOperation({ name: 'initialize_order' })
  async initializeOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { userId, productId, quantity } = createOrderDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found `);

    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product with ID ${productId} not found`);

    const totalAmountUsd = product.priceUsd * quantity;

    const order = this.orderRepository.create({
      user,
      product,
      quantity,
      totalAmountUsd,
      totalAmountCop: null,
      exchangeRate: null,
      status: OrderStatus.PENDING,
    });

    return this.orderRepository.save(order);
  }
}
