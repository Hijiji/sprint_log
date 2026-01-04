import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';
import { runInTransaction } from 'src/common/database/transaction.helper';
import { DataSource } from 'typeorm';
import { WorkLog } from 'src/database/entities/worklog.entity';
import { Member } from 'src/database/entities/member.entity';
import { Task } from 'src/database/entities/task.entity';
import { WorkLogIdDto } from './dto/worklog-id.dto';

@Injectable()
export class WorkLogService {
  constructor(private readonly dataSource: DataSource) {}

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

      // sprint, member 엔티티 로드
      const task = createWorkLogDto.taskId
        ? await taskRepository.findOne({
            where: { taskId: createWorkLogDto.taskId },
          })
        : null;

      const member = createWorkLogDto.memberId
        ? await memberRepository.findOne({
            where: { memberId: createWorkLogDto.memberId },
          })
        : null;

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

  findAll() {
    return `This action returns all workLog`;
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
        throw new BadRequestException('존재하지 않는 업무일지입니다.');
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
        throw new BadRequestException('존재하지 않는 업무일지입니다.');
      }
      worklog.isDeleted = true;
      worklog.deletedAt = new Date();
      return workLogRepository.save(worklog);
    });
  }
}
