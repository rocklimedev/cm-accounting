import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateExpenseTitleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
