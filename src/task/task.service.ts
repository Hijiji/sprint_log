import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindAllTaskDto } from './dto/find-all-task.dto';
import { DataSource } from 'typeorm';
import { Task } from 'src/database/entities/task.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { runInTransaction } from 'src/common/database/transaction.helper';
import { TaskCursorMetaDto } from 'src/common/dto/task-cursor-meta.dto';

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

    const taskData = {
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
      isBackLog: !createTaskDto.sprintId, // sprintId가 없으면 백로그
      sprintId: createTaskDto.sprintId || null,
      memberId: createTaskDto.memberId || null,
    };

    return runInTransaction(this.dataSource, async (manager) => {
      const taskRepository = manager.getRepository(Task);
      return taskRepository.save(taskData);
    });
  }

  /**
   * 업무 목록 조회 (필터링 + Cursor 페이징)
   * @param findAllTaskDto
   * @returns
   */
  async findAll(findAllTaskDto: FindAllTaskDto) {
    const limit = findAllTaskDto.limit ?? 10;
    const cursor = findAllTaskDto.cursor;

    const taskRepository = this.dataSource.getRepository(Task);
    const queryBuilder = taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.sprint', 'sprint')
      .leftJoinAndSelect('task.members', 'member')
      .where('task.isDeleted = :isDeleted', { isDeleted: false });

    // 필터링 조건
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
    if (cursor) {
      queryBuilder.andWhere('task.taskId > :cursor', { cursor });
    }

    // 정렬 및 조회 (limit + 1)
    const tasks = await queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .addOrderBy('task.taskId', 'DESC')
      .take(limit + 1)
      .getMany();

    // 실제 반환 데이터 (limit개만)
    const result = tasks.slice(0, limit);

    return {
      tasks: result,
      meta: TaskCursorMetaDto.create(tasks, limit),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return `This action updates a #${id} task`;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
