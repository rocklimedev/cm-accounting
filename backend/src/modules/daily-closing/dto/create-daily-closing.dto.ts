import { IsDateString } from 'class-validator';

export class CreateDailyClosingDto {
  @IsDateString()
  report_date: string;
}
