import { IsNumber, IsPositive, Min } from 'class-validator';

const MIN_AMOUNT_USD = 1500;

export class QuoteRequestDto {
  @IsNumber()
  @IsPositive()
  @Min(MIN_AMOUNT_USD, {
    message: `Minimum amount is $15.00 USD (received: $${MIN_AMOUNT_USD / 100})`,
  })
  amount: number;
}
