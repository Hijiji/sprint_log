import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindAllTaskDto } from './dto/find-all-task.dto';
import { DataSource } from 'typeorm';
import { Task } from 'src/database/entities/task.entity';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Member } from 'src/database/entities/member.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { runInTransaction } from 'src/common/transaction/transaction.helper';
import { validateDateRange } from 'src/common/utils/date.utils';
import { ERROR_MESSAGES } from 'src/common/constants/error-messages';
import { TaskCursorMetaDto } from 'src/common/dto/cursor-meta.dto';
import { TaskIdDto } from './dto/task-id.dto';
import { WorkLog } from 'src/database/entities/worklog.entity';

@Injectable()
export class TaskService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 업무 하나 생성
   * @param createTaskDto
   * @returns
   */
  async create(createTaskDto: CreateTaskDto) {
    // 날짜 범위 검증
    validateDateRange(
      createTaskDto.expectedStartDate,
      createTaskDto.expectedEndDate,
    );

    return runInTransaction(this.dataSource, async (manager) => {
      const [sprint, member] = await Promise.all([
        this.validateSprint(manager, createTaskDto.sprintId),
        this.validateMember(manager, createTaskDto.memberId),
      ]);

      const taskRepository = manager.getRepository(Task);
      const task = taskRepository.create({
        ...createTaskDto,
        snapshotExpectedWorkTime:
          createTaskDto.status === TaskStatusEnum.ACTIVE
            ? createTaskDto.expectedWorkTime || 0
            : 0, // 스냅샷 저장
        startDate:
          createTaskDto.status === TaskStatusEnum.ACTIVE ? new Date() : null,
        endDate:
          createTaskDto.status === TaskStatusEnum.COMPLETED ? new Date() : null,
        isBackLog: !sprint, // 스프린트 없으면 백로그
        sprint,
        member,
      });

      return taskRepository.save(task);
    });
  }

  /**
   * Sprint 검증
   */
  private async validateSprint(
    manager: any,
    sprintId?: string,
  ): Promise<Sprint | null> {
    if (!sprintId) return null;
    const sprint = await manager.getRepository(Sprint).findOne({
      where: { sprintId },
    });
    if (!sprint) {
      throw new BadRequestException(ERROR_MESSAGES.SPRINT_NOT_FOUND);
    }
    return sprint;
  }

  /**
   * Member 검증
   */
  private async validateMember(
    manager: any,
    memberId?: string,
  ): Promise<Member | null> {
    if (!memberId) return null;
    const member = await manager.getRepository(Member).findOne({
      where: { memberId },
    });
    if (!member) {
      throw new BadRequestException(ERROR_MESSAGES.MEMBER_NOT_FOUND);
    }
    return member;
  }

  /**
   * 업무 목록 조회 (필터링 + Cursor 페이징)
   * @param findAllTaskDto
   * @returns
   */
  async findAll(findAllTaskDto: FindAllTaskDto) {
    const taskRepository = this.dataSource.getRepository(Task);
    const queryBuilder = taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.sprint', 'sprint')
      .leftJoinAndSelect('task.member', 'member')
      .where('task.isDeleted = :isDeleted', { isDeleted: false });

    //필터, 검색 조건 적용
    this.applyFilters(queryBuilder, findAllTaskDto);

    const limit = findAllTaskDto.limit ?? 10;
    const tasks = await queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .addOrderBy('task.taskId', 'DESC')
      .take(limit + 1)
      .getMany();

    const result = tasks.slice(0, limit);
    return {
      tasks: result,
      meta: TaskCursorMetaDto.create(tasks, limit),
    };
  }

  /**
   * QueryBuilder에 필터 조건 적용
   */
  private applyFilters(queryBuilder: any, filters: FindAllTaskDto): void {
    if (filters.status) {
      queryBuilder.andWhere('task.status = :status', {
        status: filters.status,
      });
    }
    if (filters.sprintTitle) {
      queryBuilder.andWhere('sprint.title LIKE :sprintTitle', {
        sprintTitle: `%${filters.sprintTitle}%`,
      });
    }
    if (filters.memberName) {
      queryBuilder.andWhere('member.name LIKE :memberName', {
        memberName: `%${filters.memberName}%`,
      });
    }
    if (filters.taskTitle) {
      queryBuilder.andWhere('task.title LIKE :taskTitle', {
        taskTitle: `%${filters.taskTitle}%`,
      });
    }
    if (filters.memberId) {
      queryBuilder.andWhere('member.memberId = :memberId', {
        memberId: filters.memberId,
      });
    }
    if (filters.sprintId) {
      queryBuilder.andWhere('sprint.sprintId = :sprintId', {
        sprintId: filters.sprintId,
      });
    }
    if (filters.cursor) {
      queryBuilder.andWhere('task.taskId > :cursor', {
        cursor: filters.cursor,
      });
    }
  }

  /**
   * 업무 상세 조회
   * @param taskIdDto
   * @returns
   */
  async findOne(taskIdDto: TaskIdDto) {
    const taskRepository = this.dataSource.getRepository(Task);
    const worklogRepository = this.dataSource.getRepository(WorkLog);
    const task = await taskRepository.findOne({
      select: {
        taskId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        expectedStartDate: true,
        expectedEndDate: true,
        expectedWorkTime: true,
        startDate: true,
        endDate: true,
        isBackLog: true,
        priority: true,
        member: { memberId: true, name: true },
      },
      where: { taskId: taskIdDto.id, isDeleted: false },
      relations: ['member'],
    });

    if (!task) throw new BadRequestException(ERROR_MESSAGES.TASK_NOT_FOUND);

    const worklogs = await worklogRepository.find({
      where: { task: { taskId: taskIdDto.id }, isDeleted: false },
      select: ['workLogId', 'title', 'workTime', 'workDate'],
    });

    task.worklogs = worklogs;

    return task;
  }

  /**
   * 업무 정보 수정
   * @param taskIdDto
   * @param updateTaskDto
   * @returns
   */
  async update(taskIdDto: TaskIdDto, updateTaskDto: UpdateTaskDto) {
    validateDateRange(
      updateTaskDto.expectedStartDate,
      updateTaskDto.expectedEndDate,
    );

    return runInTransaction(this.dataSource, async (manager) => {
      const taskRepository = manager.getRepository(Task);
      const task = await taskRepository.findOne({
        where: { taskId: taskIdDto.id, isDeleted: false },
      });
      if (!task) throw new BadRequestException(ERROR_MESSAGES.TASK_NOT_FOUND);

      // 업데이트할 데이터 추가
      this.updateBasicFields(task, updateTaskDto);

      // Sprint 관계 업데이트
      if (updateTaskDto.sprintId) {
        const sprint = await this.validateSprint(
          manager,
          updateTaskDto.sprintId,
        );
        task.sprint = sprint;
        task.isBackLog = !sprint;
      }

      // Member 관계 업데이트
      if (updateTaskDto.memberId) {
        const member = await this.validateMember(
          manager,
          updateTaskDto.memberId,
        );
        task.member = member;
      }
      return taskRepository.save(task);
    });
  }

  /**
   * 기본 필드 업데이트
   */
  private updateBasicFields(task: Task, updates: UpdateTaskDto): void {
    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined)
      task.description = updates.description;
    if (updates.expectedStartDate !== undefined)
      task.expectedStartDate = updates.expectedStartDate || null;
    if (updates.expectedEndDate !== undefined)
      task.expectedEndDate = updates.expectedEndDate || null;
    if (updates.expectedWorkTime !== undefined)
      task.expectedWorkTime = updates.expectedWorkTime;
    if (updates.priority !== undefined) task.priority = updates.priority;

    if (updates.status === undefined) return;

    if (
      updates.status === TaskStatusEnum.ACTIVE &&
      task.status !== TaskStatusEnum.ACTIVE
    ) {
      task.startDate = new Date();
    }
    if (
      updates.status === TaskStatusEnum.COMPLETED &&
      task.status !== TaskStatusEnum.COMPLETED
    ) {
      task.endDate = new Date();
    }
    task.status = updates.status;
  }

  /**
   * 업무 하위에 업무일지있는지 확인
   */
  async hasWorkLogs(taskIdDto: TaskIdDto): Promise<boolean> {
    const workLogRepository = this.dataSource.getRepository(WorkLog);
    const count = await workLogRepository.count({
      where: { task: { taskId: taskIdDto.id }, isDeleted: false },
    });
    return count > 0;
  }

  /**
   * 업무 하나 삭제 - soft delete
   * @param taskIdDto
   * @param removeWithWorkLogs
   * @returns
   */
  async remove(taskIdDto: TaskIdDto, removeWithWorkLogs: boolean) {
    return runInTransaction(this.dataSource, async (manager) => {
      const taskRepository = manager.getRepository(Task);
      const task = await taskRepository.findOne({
        where: { taskId: taskIdDto.id, isDeleted: false },
      });
      if (!task) throw new BadRequestException(ERROR_MESSAGES.TASK_NOT_FOUND);

      if (removeWithWorkLogs) {
        const workLogRepository = manager.getRepository(WorkLog);
        await workLogRepository.update(
          { task: { taskId: taskIdDto.id }, isDeleted: false },
          { isDeleted: true, deletedAt: new Date() },
        );
      }
      task.isDeleted = true;
      task.deletedAt = new Date();
      return taskRepository.save(task);
    });
  }

  /**
   * 업무에 스프린트 할당
   * @param taskId
   * @param sprintId
   * @returns
   */
  async assignSprint(taskId: string, sprintId: string) {
    return runInTransaction(this.dataSource, async (manager) => {
      const taskRepository = manager.getRepository(Task);
      const sprintRepository = manager.getRepository(Sprint);

      const task = await taskRepository.findOne({
        where: { taskId: taskId, isDeleted: false },
      });
      if (!task) throw new BadRequestException(ERROR_MESSAGES.TASK_NOT_FOUND);

      const sprint = await sprintRepository.findOne({
        where: { sprintId: sprintId, isDeleted: false },
      });
      if (!sprint)
        throw new BadRequestException(ERROR_MESSAGES.SPRINT_NOT_FOUND);

      task.sprint = sprint;
      task.isBackLog = false;
      return taskRepository.save(task);
    });
  }

  /**
   * 업무에 할당된 스프린트 제거
   * @param taskIdDto
   * @returns
   */
  async removeAssignSprint(taskIdDto: TaskIdDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const taskRepository = manager.getRepository(Task);
      const task = await taskRepository.findOne({
        where: { taskId: taskIdDto.id, isDeleted: false },
      });
      if (!task) throw new BadRequestException(ERROR_MESSAGES.TASK_NOT_FOUND);

      task.sprint = null;
      task.isBackLog = true;
      return taskRepository.save(task);
    });
  }
}
