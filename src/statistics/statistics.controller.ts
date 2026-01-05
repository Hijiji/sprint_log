import { Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('sprints/:id')
  findSprintStatistics(@Param() id: string) {
    return this.statisticsService.findSprintStatistics();
  }

  @Get('users/:id/summary')
  findUserSummary(@Param() id: string) {
    return this.statisticsService.findUserSummary(+id);
  }

  @Get('tasks/:id/time-tracking')
  findTaskTimeTracking(@Param() id: string) {
    return this.statisticsService.findTaskTimeTracking(+id);
  }
}
