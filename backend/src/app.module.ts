import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { OrdersModule } from './modules/orders/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProductsModule } from './modules/products/product.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PaymentModule,
    OrdersModule,
    ProductsModule,
    UsersModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.user'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        // To fastest develop
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
  ],

  controllers: [AppController],
  providers: [],
})
export class AppModule {}
