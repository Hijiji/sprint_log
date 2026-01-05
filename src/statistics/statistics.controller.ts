import { Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { SprintIdDto } from 'src/sprint/dto/sprint-id-dto';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('sprints/:id')
  findSprintStatistics(@Param() sprintIdDto: SprintIdDto) {
    return this.statisticsService.findSprintStatistics(sprintIdDto);
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
