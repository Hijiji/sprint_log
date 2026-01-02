import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindAllTaskDto } from './dto/find-all-task.dto';
import { DataSource } from 'typeorm';
import { Task } from 'src/database/entities/task.entity';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Member } from 'src/database/entities/member.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { runInTransaction } from 'src/common/database/transaction.helper';
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
    if (createTaskDto.expectedStartDate && createTaskDto.expectedEndDate) {
      const startDate = new Date(createTaskDto.expectedStartDate);
      const endDate = new Date(createTaskDto.expectedEndDate);
      if (startDate > endDate) {
        throw new BadRequestException(
          '종료 예정일은 시작 예정일보다 늦어야 합니다.',
        );
      }
    }

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
        startDate:
          createTaskDto.status === TaskStatusEnum.ACTIVE ? new Date() : null,
        endDate:
          createTaskDto.status === TaskStatusEnum.COMPLETED ? new Date() : null,
        priority: createTaskDto.priority || null,
        isBackLog: !createTaskDto.sprintId, // sprint이 없으면 백로그
        sprint,
        members: member,
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
      .leftJoinAndSelect('task.members', 'member')
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

  findOne(taskIdDto: TaskIdDto) {
    return `This action returns a #${taskIdDto.id} task`;
  }

  /**
   * 업무 정보 수정
   * @param id
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
      if (!task) throw new BadRequestException('존재하지 않는 업무입니다.');

      // 예상 날짜 검증
      if (updateTaskDto.expectedStartDate && updateTaskDto.expectedEndDate) {
        const startDate = new Date(updateTaskDto.expectedStartDate);
        const endDate = new Date(updateTaskDto.expectedEndDate);
        if (startDate > endDate) {
          throw new BadRequestException(
            '종료 예정일은 시작 예정일보다 늦어야 합니다.',
          );
        }
      }

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
            throw new BadRequestException('존재하지 않는 스프린트입니다.');
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
            throw new BadRequestException('존재하지 않는 사용자입니다.');
          task.members = member;
        } else {
          task.members = null;
        }
      }

      task.updatedAt = new Date();
      return taskRepository.save(task);
    });
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
      if (!task) throw new BadRequestException('존재하지 않는 업무입니다.');

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
      if (!task) throw new BadRequestException('존재하지 않는 업무입니다.');

      task.sprint = null;
      task.isBackLog = true;
      task.updatedAt = new Date();
      return taskRepository.save(task);
    });
  }
}
