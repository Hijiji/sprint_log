import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';
import { runInTransaction } from 'src/common/transaction/transaction.helper';
import { ERROR_MESSAGES } from 'src/common/constants/error-messages';
import { DataSource } from 'typeorm';
import { WorkLog } from 'src/database/entities/worklog.entity';
import { Member } from 'src/database/entities/member.entity';
import { Task } from 'src/database/entities/task.entity';
import { WorkLogIdDto } from './dto/worklog-id.dto';
import { FindAllWorklogDto } from './dto/find-all-worklog.dto';
import { ConfigService } from '@nestjs/config';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

@Injectable()
export class WorkLogService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 업무 일지 생성
   * @param createWorkLogDto
   * @returns
   */
  async create(createWorkLogDto: CreateWorkLogDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const workLogRepository = manager.getRepository(WorkLog);
      const taskRepository = manager.getRepository(Task);
      const memberRepository = manager.getRepository(Member);

      // task, member 엔티티 로드
      const task = await taskRepository.findOne({
        where: { taskId: createWorkLogDto.taskId },
      });
      if (!task) {
        throw new BadRequestException(ERROR_MESSAGES.TASK_NOT_FOUND);
      }

      const member = await memberRepository.findOne({
        where: { memberId: createWorkLogDto.memberId },
      });
      if (!member) {
        throw new BadRequestException(ERROR_MESSAGES.MEMBER_NOT_FOUND);
      }

      const worklog = workLogRepository.create({
        title: createWorkLogDto.title,
        contents: createWorkLogDto.contents,
        workDate: createWorkLogDto.workDate,
        workTime: createWorkLogDto.workTime,
        createdAt: new Date(),
        task,
        member: member,
      });

      return workLogRepository.save(worklog);
    });
  }

  /**
   * 업무 일지 목록조회 (필터링 + 오프셋페이징)
   * @returns
   */
  async findAll(findAllWorklogDto: FindAllWorklogDto) {
    const defaultLimit = this.configService.get<number>(
      'pagination.defaultLimit',
    );
    const offset = findAllWorklogDto.offset ?? 0;
    const limit = findAllWorklogDto.limit ?? defaultLimit;

    const workLogRepository = this.dataSource.getRepository(WorkLog);

    const queryBuilder = workLogRepository
      .createQueryBuilder('worklog')
      .leftJoinAndSelect('worklog.task', 'task')
      .leftJoinAndSelect('worklog.member', 'member')
      .where('task.isDeleted = :isDeleted', { isDeleted: false });

    if (findAllWorklogDto.memberName) {
      queryBuilder.andWhere('member.name LIKE :memberName', {
        memberName: `%${findAllWorklogDto.memberName}%`,
      });
    }
    if (findAllWorklogDto.taskTitle) {
      queryBuilder.andWhere('task.title Like :taskTitle', {
        taskTitle: `%${findAllWorklogDto.taskTitle}%`,
      });
    }
    if (findAllWorklogDto.workDate) {
      queryBuilder.andWhere('worklog.workDate = :workDate', {
        workDate: findAllWorklogDto.workDate,
      });
    }

    const worklogs = await queryBuilder
      .orderBy('worklog.createdAt', 'DESC')
      .addOrderBy('worklog.workLogId', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();
    const result = worklogs.map((workLog) => {
      return {
        workLogId: workLog.workLogId,
        title: workLog.title,
        contents: workLog.contents,
        workDate: workLog.workDate,
        workTime: workLog.workTime,
        createdAt: workLog.createdAt,
        task: {
          taskId: workLog.task?.taskId,
          taskTitle: workLog.task?.title,
          expectedWorkTime: workLog.task?.expectedWorkTime,
          priority: workLog.task?.priority,
          status: workLog.task?.status,
        },
        member: {
          memberId: workLog.member?.memberId,
          memberName: workLog.member?.name,
        },
      };
    });
    return {
      workLogs: result,
      meta: PaginationMetaDto.create(worklogs.length, offset, limit),
    };
  }

  /**
   * 업무 일지 하나 조회
   * @param workLogIdDto
   * @returns
   */
  async findOne(workLogIdDto: WorkLogIdDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const workLogRepository = manager.getRepository(WorkLog);

      const worklog = await workLogRepository.findOne({
        select: {
          workLogId: true,
          title: true,
          contents: true,
          createdAt: true,
          workTime: true,
          workDate: true,
          isDeleted: true,
          deletedAt: true,
          member: { memberId: true, name: true },
        },
        where: { workLogId: workLogIdDto.id, isDeleted: false },
        relations: ['member'],
      });

      return worklog;
    });
  }

  /**
   * 업무 일지 수정
   * @param workLogIdDto
   * @param updateWorkLogDto
   * @returns
   */
  async update(workLogIdDto: WorkLogIdDto, updateWorkLogDto: UpdateWorkLogDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const workLogRepository = manager.getRepository(WorkLog);

      const worklog = await workLogRepository.findOne({
        where: { workLogId: workLogIdDto.id, isDeleted: false },
      });

      if (!worklog) {
        throw new BadRequestException(ERROR_MESSAGES.WORKLOG_NOT_FOUND);
      }
      if (updateWorkLogDto.title != undefined)
        worklog.title = updateWorkLogDto.title ?? worklog.title;
      if (updateWorkLogDto.contents != undefined)
        worklog.contents = updateWorkLogDto.contents ?? worklog.contents;
      if (updateWorkLogDto.workDate != undefined)
        worklog.workDate = updateWorkLogDto.workDate ?? worklog.workDate;
      if (updateWorkLogDto.workTime != undefined)
        worklog.workTime = updateWorkLogDto.workTime ?? worklog.workTime;

      return workLogRepository.save(worklog);
    });
  }

  /**
   * 업무 일지 삭제 - soft delete
   * @param workLogIdDto
   * @returns
   */
  async remove(workLogIdDto: WorkLogIdDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const workLogRepository = manager.getRepository(WorkLog);
      const worklog = await workLogRepository.findOne({
        where: { workLogId: workLogIdDto.id, isDeleted: false },
      });
      if (!worklog) {
        throw new BadRequestException(ERROR_MESSAGES.WORKLOG_NOT_FOUND);
      }
      worklog.isDeleted = true;
      worklog.deletedAt = new Date();
      return workLogRepository.save(worklog);
    });
  }
}
