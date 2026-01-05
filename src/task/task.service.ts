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
    // 예상 날짜 검증
    validateDateRange(
      createTaskDto.expectedStartDate,
      createTaskDto.expectedEndDate,
    );

    return runInTransaction(this.dataSource, async (manager) => {
      const taskRepository = manager.getRepository(Task);
      const sprintRepository = manager.getRepository(Sprint);
      const memberRepository = manager.getRepository(Member);

      // sprint, member 엔티티 로드
      const sprint = createTaskDto.sprintId
        ? await sprintRepository.findOne({
            where: { sprintId: createTaskDto.sprintId },
          })
        : null;

      const member = createTaskDto.memberId
        ? await memberRepository.findOne({
            where: { memberId: createTaskDto.memberId },
          })
        : null;

      const task = taskRepository.create({
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status || TaskStatusEnum.PLANNED,
        expectedStartDate: createTaskDto.expectedStartDate || null,
        expectedEndDate: createTaskDto.expectedEndDate || null,
        expectedWorkTime: createTaskDto.expectedWorkTime || 0,
        snapshotExpectedWorkTime:
          createTaskDto.status === TaskStatusEnum.ACTIVE
            ? createTaskDto.expectedWorkTime || 0
            : 0, // 스냅샷 저장
        startDate:
          createTaskDto.status === TaskStatusEnum.ACTIVE ? new Date() : null,
        endDate:
          createTaskDto.status === TaskStatusEnum.COMPLETED ? new Date() : null,
        priority: createTaskDto.priority || null,
        isBackLog: !createTaskDto.sprintId, // sprint이 없으면 백로그
        sprint,
        member: member,
      });

      return taskRepository.save(task);
    });
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

    // 필터링
    if (findAllTaskDto.status) {
      queryBuilder.andWhere('task.status = :status', {
        status: findAllTaskDto.status,
      });
    }

    if (findAllTaskDto.sprintTitle) {
      queryBuilder.andWhere('sprint.title LIKE :sprintTitle', {
        sprintTitle: `%${findAllTaskDto.sprintTitle}%`,
      });
    }

    if (findAllTaskDto.memberName) {
      queryBuilder.andWhere('member.name LIKE :memberName', {
        memberName: `%${findAllTaskDto.memberName}%`,
      });
    }

    if (findAllTaskDto.taskTitle) {
      queryBuilder.andWhere('task.title LIKE :taskTitle', {
        taskTitle: `%${findAllTaskDto.taskTitle}%`,
      });
    }

    // Cursor 처리
    if (findAllTaskDto.cursor) {
      queryBuilder.andWhere('task.taskId > :cursor', {
        cursor: findAllTaskDto.cursor,
      });
    }

    // 정렬 및 조회 (limit + 1)
    const tasks = await queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .addOrderBy('task.taskId', 'DESC')
      .take(findAllTaskDto.limit + 1)
      .getMany();

    const result = tasks.slice(0, findAllTaskDto.limit);
    return {
      tasks: result,
      meta: TaskCursorMetaDto.create(tasks, findAllTaskDto.limit),
    };
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

    // task 객체에 worklogs 추가
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
    return runInTransaction(this.dataSource, async (manager) => {
      const taskRepository = manager.getRepository(Task);
      const sprintRepository = manager.getRepository(Sprint);
      const memberRepository = manager.getRepository(Member);

      const task = await taskRepository.findOne({
        where: { taskId: taskIdDto.id, isDeleted: false },
      });
      if (!task) throw new BadRequestException(ERROR_MESSAGES.TASK_NOT_FOUND);

      // 예상 날짜 검증
      validateDateRange(
        updateTaskDto.expectedStartDate,
        updateTaskDto.expectedEndDate,
      );

      // 기본 필드 업데이트 (sprintId, memberId 제외)
      if (updateTaskDto.title !== undefined) task.title = updateTaskDto.title;
      if (updateTaskDto.description !== undefined)
        task.description = updateTaskDto.description;
      if (updateTaskDto.expectedStartDate !== undefined)
        task.expectedStartDate = updateTaskDto.expectedStartDate || null;
      if (updateTaskDto.expectedEndDate !== undefined)
        task.expectedEndDate = updateTaskDto.expectedEndDate || null;
      if (updateTaskDto.expectedWorkTime !== undefined)
        task.expectedWorkTime = updateTaskDto.expectedWorkTime;
      if (updateTaskDto.priority !== undefined)
        task.priority = updateTaskDto.priority;

      // 상태 변경에 따른 날짜 자동 설정
      if (updateTaskDto.status !== undefined) {
        if (
          updateTaskDto.status === TaskStatusEnum.ACTIVE &&
          task.status !== TaskStatusEnum.ACTIVE
        ) {
          task.startDate = new Date();
        }
        if (
          updateTaskDto.status === TaskStatusEnum.COMPLETED &&
          task.status !== TaskStatusEnum.COMPLETED
        ) {
          task.endDate = new Date();
        }
        task.status = updateTaskDto.status;
      }

      // Sprint 관계 업데이트
      if (updateTaskDto.sprintId !== undefined) {
        if (updateTaskDto.sprintId) {
          const sprint = await sprintRepository.findOne({
            where: { sprintId: updateTaskDto.sprintId },
          });
          if (!sprint)
            throw new BadRequestException(ERROR_MESSAGES.SPRINT_NOT_FOUND);
          task.sprint = sprint;
          task.isBackLog = false;
        } else {
          task.sprint = null;
          task.isBackLog = true;
        }
      }

      // Member 관계 업데이트
      if (updateTaskDto.memberId !== undefined) {
        if (updateTaskDto.memberId) {
          const member = await memberRepository.findOne({
            where: { memberId: updateTaskDto.memberId },
          });
          if (!member)
            throw new BadRequestException(ERROR_MESSAGES.MEMBER_NOT_FOUND);
          task.member = member;
        } else {
          task.member = null;
        }
      }

      task.updatedAt = new Date();
      return taskRepository.save(task);
    });
  }

  /**
   * 업무 하위에 업무 일지있는지 확인
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
   * @returns
   */
  async remove(taskIdDto: TaskIdDto, removeWithWorkLogs: boolean) {
    runInTransaction(this.dataSource, async (manager) => {
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
      task.updatedAt = new Date();
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
      task.updatedAt = new Date();
      return taskRepository.save(task);
    });
  }
}
