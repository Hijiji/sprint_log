import { Injectable } from '@nestjs/common';
import { SprintIdDto } from './dto/sprint-id.dto';
import { DataSource } from 'typeorm';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Task } from 'src/database/entities/task.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';

@Injectable()
export class StatisticsService {
  constructor(private readonly datasource: DataSource) {}
  /**
   * 스프린트별 목표 달성률/스프린트별 완료율 및 통계 - 하위 업무 총갯수, 완료/진행/보류/할일 갯수를 백분율로 관리
   * @param sprintIdDto
   * @returns
   */
  async findSprintStatistics(sprintIdDto: SprintIdDto) {
    const taskRepository = this.datasource.getRepository(Task);

    const [tasksList, totalTaskCount] = await taskRepository.findAndCount({
      where: { sprint: { sprintId: sprintIdDto.id }, isDeleted: false },
    });

    // Status별 통계
    const statusCounts = {
      [TaskStatusEnum.PLANNED]: 0,
      [TaskStatusEnum.ACTIVE]: 0,
      [TaskStatusEnum.COMPLETED]: 0,
      [TaskStatusEnum.HOLD]: 0,
    };

    // Task 목록을 순회하며 status별 개수 집계
    tasksList.forEach((task) => {
      statusCounts[task.status]++;
    });

    // 백분율 계산
    const statusPercentage = {
      [TaskStatusEnum.PLANNED]:
        totalTaskCount > 0
          ? Math.round(
              (statusCounts[TaskStatusEnum.PLANNED] / totalTaskCount) * 100,
            )
          : 0,
      [TaskStatusEnum.ACTIVE]:
        totalTaskCount > 0
          ? Math.round(
              (statusCounts[TaskStatusEnum.ACTIVE] / totalTaskCount) * 100,
            )
          : 0,
      [TaskStatusEnum.COMPLETED]:
        totalTaskCount > 0
          ? Math.round(
              (statusCounts[TaskStatusEnum.COMPLETED] / totalTaskCount) * 100,
            )
          : 0,
      [TaskStatusEnum.HOLD]:
        totalTaskCount > 0
          ? Math.round(
              (statusCounts[TaskStatusEnum.HOLD] / totalTaskCount) * 100,
            )
          : 0,
    };

    return {
      sprintId: sprintIdDto.id,
      totalTaskCount,
      statusCounts,
      statusPercentage: statusPercentage,
    };
  }

  /**
   * 사용자별 업무처리 현황 : 완료한 업무수, 진행중인 업무수, 할일수, 총업무시간 등 //전체, 월별, 스프린트별
   * @param userId
   * @returns
   */
  async findUserSummary(userId: number) {
    // 사용자 요약 통계 로직 구현
    return { message: `User summary data for user ${userId}` };
  }

  /**
   * 업무별 계획 대비 실제 소요시간 분석 // 업무별 예상 vs 실제 시간 분석 (업무 시작시 기록된 예상시간 스냅샷 vs worklog 합계 비교)
   * @param taskId
   * @returns
   */
  async findTaskTimeTracking(taskId: number) {
    // 업무 시간 추적 통계 로직 구현
    return { message: `Time tracking data for task ${taskId}` };
  }
}
