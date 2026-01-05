import { Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { SprintIdDto } from 'src/sprint/dto/sprint-id-dto';
import { MemberIdDto } from './dto/member-id.dto';
import { Member } from 'src/database/entities/member.entity';
import { TaskIdDto } from './dto/task-id.dto';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('sprints/:id')
  findSprintStatistics(@Param() sprintIdDto: SprintIdDto) {
    return this.statisticsService.findSprintStatistics(sprintIdDto);
  }

  @Get('users/:id/summary')
  findUserSummary(@Param() memberIdDto: MemberIdDto) {
    return this.statisticsService.findUserSummary(memberIdDto);
  }

  @Get('tasks/:id/time-tracking')
  findTaskTimeTracking(@Param() taskIdDto: TaskIdDto) {
    return this.statisticsService.findTaskTimeTracking(taskIdDto);
  }
}
