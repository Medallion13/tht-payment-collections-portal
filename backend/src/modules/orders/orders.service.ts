import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderStatus } from '@tht/shared';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { LogOperation } from '../../common/decorators/log-operation.decorator';
import { Product } from '../products/entities/product.entity';
import { SupraBalanceService } from '../supra/services/supra-balance.service';
import { SupraPaymentService } from '../supra/services/supra-payment.service';
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

    private readonly supraBalanceService: SupraBalanceService,

    private readonly supraPaymentService: SupraPaymentService,
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

  @LogOperation({ name: 'process_payment_attempt' })
  async processPaymentAttempt(orderId: string, mockBalance?: number): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === OrderStatus.COMPLETED) {
      return order;
    }

    // Check balance
    let availableUsd = 0;
    if (mockBalance !== undefined) {
      availableUsd = mockBalance;
    } else {
      const balance = await this.supraBalanceService.getBalance();
      availableUsd = balance.usd;
    }

    // Check available usd to make a decision
    if (availableUsd >= order.totalAmountUsd) {
      const simulatedSupraTxId = `TX-Internal-${randomUUID().slice(0, 8)}`;

      return this.finalizeOrderWithBalance(order, simulatedSupraTxId);
    }

    return order;
  }

  // State updates
  private async finalizeOrderWithBalance(order: Order, transactionId: string): Promise<Order> {
    order.status = OrderStatus.COMPLETED;
    order.transactionId = transactionId;
    order.updatedAt = new Date();

    // USD -> USD transaction no necesity to save transformation values
    order.totalAmountCop = null;
    order.exchangeRate = null;

    return this.orderRepository.save(order);
  }

  @LogOperation({ name: 'update_order_snapshot' })
  async updateOrderSnapshot(
    orderId: string,
    transactionId: string,
    totalAmountCop: number,
    exchangeRate: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    order.transactionId = transactionId;
    order.status = OrderStatus.PENDING;
    order.exchangeRate = exchangeRate;
    order.totalAmountCop = Math.trunc(totalAmountCop);
    order.updatedAt = new Date();

    return this.orderRepository.save(order);
  }

  @LogOperation({ name: 'finalize_order_external' })
  async finalizeOrderExternal(
    orderId: string,
    transactionId: string,
    amountCop: number,
    rate: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    order.status = OrderStatus.COMPLETED;
    order.transactionId = transactionId;
    order.totalAmountCop = amountCop;
    order.exchangeRate = rate;
    order.updatedAt = new Date();

    return this.orderRepository.save(order);
  }

  @LogOperation({ name: 'find_order_by_id' })
  async findOrderById(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['product'], // to price validation
    });
  }

  @LogOperation({ name: 'finalize_order ' })
  async finalizeOrder(orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    // Check if order have the transaction id
    if (!order.transactionId) {
      throw new BadRequestException('Order has no associeted payment');
    }

    // Get supra status
    const supraStatus = await this.supraPaymentService.getPaymentStatus(order.transactionId);
    const totalCost = Math.trunc(supraStatus.amount * 100); // to keep the factor 100 in the database

    if (supraStatus.status == 'PAID') {
      const rate = order.exchangeRate ?? 0;
      return this.finalizeOrderExternal(order.id, order.transactionId, totalCost, rate);
    }

    return order;
  }
}
