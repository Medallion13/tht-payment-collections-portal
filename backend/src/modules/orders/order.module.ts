import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';

@Module({
  exports: [TypeOrmModule.forFeature([Order])],
  imports: [TypeOrmModule],
})
export class OrdersModule {}
