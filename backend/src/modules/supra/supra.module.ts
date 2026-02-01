import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SupraService } from './supra.service';

@Module({
  imports: [HttpModule],
  providers: [SupraService],
  exports: [SupraService],
})
export class SupraModule {}
