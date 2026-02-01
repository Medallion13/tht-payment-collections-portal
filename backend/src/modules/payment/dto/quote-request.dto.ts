import { IsNumber, IsPositive } from 'class-validator';

export class QuoteRequestDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}
