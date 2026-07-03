import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePaymentModeDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
