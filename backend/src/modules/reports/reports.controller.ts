import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getReports(@Query() query: any) {
    return this.reportsService.getReports(query);
  }
  @Get('dashboard')
  async dashboard(@Query() query: any) {
    return this.reportsService.dashboard(query);
  }
  @Get('drafts')
  async getDraftReports() {
    return this.reportsService.getDraftReports();
  }
}
