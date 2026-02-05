import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SupraBalanceService } from './services/supra-balance.service';
import { SupraClientService } from './services/supra-client.service';
import { SupraPaymentService } from './services/supra-payment.service';
import { SupraQuoteService } from './services/supra-quote.service';
import { SupraService } from './supra.service';

@Module({
  imports: [HttpModule],
  providers: [
    SupraService,
    SupraClientService,
    SupraQuoteService,
    SupraPaymentService,
    SupraBalanceService,
  ],
  exports: [SupraService, SupraQuoteService, SupraPaymentService, SupraBalanceService],
})
export class SupraModule {}
