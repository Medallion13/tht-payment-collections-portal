import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/product.module';
import { SupraModule } from '../supra/supra.module';
import { UsersModule } from '../users/users.module';
import { Order } from './entities/order.entity';
import { OrdersController } from './order.controller';
import { OrdersService } from './ordes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), UsersModule, ProductsModule, SupraModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
