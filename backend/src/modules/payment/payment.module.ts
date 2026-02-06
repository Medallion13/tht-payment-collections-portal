import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/order.module';
import { SupraModule } from '../supra/supra.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [SupraModule, OrdersModule],
  providers: [PaymentService],
  controllers: [PaymentController], // Register the define routes
})
export class PaymentModule {}
