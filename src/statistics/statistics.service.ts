import { Injectable } from '@nestjs/common';
import { SprintIdDto } from './dto/sprint-id.dto';
import { DataSource } from 'typeorm';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Task } from 'src/database/entities/task.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { MemberIdDto } from './dto/member-id.dto';
import { WorkLog } from 'src/database/entities/worklog.entity';

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
   * 사용자별 업무처리 현황 : 상태별 업무 수, 현재까지 진행된 총업무시간 등 //월별, 전체, 스프린트별
   * @param memberIdDto
   * @returns
   */
  async findUserSummary(memberIdDto: MemberIdDto) {
    const workLogRepository = this.datasource.getRepository(WorkLog);
    const worklogQueryBuilder = workLogRepository
      .createQueryBuilder('worklog')
      .leftJoin('worklog.member', 'member')
      .where('member.memberId = :memberId', { memberId: memberIdDto.id });

    const taskRepository = this.datasource.getRepository(Task);

    const taskQueryBuilder = taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.member', 'member')
      .leftJoinAndSelect('task.sprint', 'sprint')
      .where('task.member.memberId = :memberId', { memberId: memberIdDto.id });

    // 년월 필터링 (SQLite strftime 사용)
    if (memberIdDto.yearAndMonth) {
      worklogQueryBuilder.andWhere(
        "strftime('%Y-%m', worklog.workDate) = :yearAndMonth",
        { yearAndMonth: memberIdDto.yearAndMonth },
      );
      taskQueryBuilder.andWhere(
        "strftime('%Y-%m', task.expectedStartDate) = :yearAndMonth",
        { yearAndMonth: memberIdDto.yearAndMonth },
      );
    }

    // 스프린트 제목 필터링
    if (memberIdDto.sprintTitle) {
      taskQueryBuilder.andWhere('sprint.title LIKE :sprintTitle', {
        sprintTitle: `%${memberIdDto.sprintTitle}%`,
      });
    }

    const tasks = await taskQueryBuilder
      .andWhere('task.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('task.expectedStartDate', 'ASC')
      .getMany();

    // workTime 합산 조회
    const workTimeResult = await worklogQueryBuilder
      .andWhere('worklog.isDeleted = :isDeleted', { isDeleted: false })
      .select('SUM(worklog.workTime)', 'totalWorkTime')
      .getRawOne();

    // 상태별 집계
    const statusCounts = {
      [TaskStatusEnum.PLANNED]: 0,
      [TaskStatusEnum.ACTIVE]: 0,
      [TaskStatusEnum.COMPLETED]: 0,
      [TaskStatusEnum.HOLD]: 0,
    };

    tasks.forEach((task) => {
      statusCounts[task.status]++;
    });

    return {
      memberId: memberIdDto.id,
      totalTaskCount: tasks.length,
      statusCounts,
      totalWorkTime: parseInt(workTimeResult?.totalWorkTime || '0', 10),
      periodFilter: memberIdDto.yearAndMonth || 'ALL',
      selecedMonthWorkTime: parseInt(workTimeResult?.totalWorkTime || '0', 10),
    };
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
