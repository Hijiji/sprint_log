import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { SprintIdDto } from 'src/sprint/dto/sprint-id-dto';
import { MemberStatisticsDto } from './dto/member-statistics.dto';
import { TaskIdDto } from './dto/task-id.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('sprints/:id')
  @ApiOperation({
    summary: '스프린트 통계 조회',
    description:
      '스프린트의 업무 완료율, 진행 상황, 팀원별 업무량 등 전체 통계 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '스프린트 ID',
    example: 'sprint-001',
  })
  @ApiResponse({
    status: 200,
    description:
      '스프린트 통계 정보 (완료 업무, 진행 중 업무, 대기 업무, 팀원별 진행률 등)',
  })
  @ApiResponse({
    status: 400,
    description: '스프린트를 찾을 수 없습니다.',
  })
  findSprintStatistics(@Param() sprintIdDto: SprintIdDto) {
    return this.statisticsService.findSprintStatistics(sprintIdDto);
  }

  @Get('users/:id/summary')
  @ApiOperation({
    summary: '사용자 작업 요약 조회',
    description:
      '사용자의 할당된 업무, 완료된 업무, 총 작업 시간 등의 요약 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '사용자(멤버) ID',
    example: 'member-001',
  })
  @ApiResponse({
    status: 200,
    description:
      '사용자 작업 요약 정보 (할당 업무, 완료 업무, 작업 시간, 진행률 등)',
  })
  @ApiResponse({
    status: 400,
    description: '사용자를 찾을 수 없습니다.',
  })
  findUserSummary(
    @Param('id') id: string,
    @Query() memberStatisticsDto: MemberStatisticsDto,
  ) {
    return this.statisticsService.findUserSummary(id, memberStatisticsDto);
  }

  @Get('tasks/:id/time-tracking')
  @ApiOperation({
    summary: '업무 시간 추적 조회',
    description:
      '특정 업무에 대해 사용자별 작업 시간, 진행 상황, 예상 완료 시간 등을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '업무 ID',
    example: 'task-001',
  })
  @ApiResponse({
    status: 200,
    description:
      '업무 시간 추적 정보 (작업 시간, 진행률, 예상 완료 시간, 사용자별 소요 시간 등)',
  })
  @ApiResponse({
    status: 400,
    description: '업무를 찾을 수 없습니다.',
  })
  findTaskTimeTracking(@Param() taskIdDto: TaskIdDto) {
    return this.statisticsService.findTaskTimeTracking(taskIdDto);
  }
}
