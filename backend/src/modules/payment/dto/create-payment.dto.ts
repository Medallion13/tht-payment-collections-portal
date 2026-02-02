import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  quoteId: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsIn(['CC', 'NIT', 'CE', 'PA'])
  documentType: string;

  @IsString()
  @IsNotEmpty()
  document: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  cellPhone: string;
}
