import { IsInt, IsNotEmpty, IsPositive, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID('4', { message: 'userId must be a valid UUID v4' })
  userId: string;

  @IsNotEmpty()
  @IsUUID('4', { message: 'productId must be a valid UUID v4' })
  productId: string;

  @IsNotEmpty()
  @IsInt({ message: 'Quantity must be an integrer ' })
  @IsPositive({ message: 'quantity must be great than 0' })
  quantity: number;
}
