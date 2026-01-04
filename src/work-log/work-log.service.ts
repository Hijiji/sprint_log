import { Injectable } from '@nestjs/common';
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
        where: { workLogId: workLogIdDto.id },
        relations: ['member'],
      });

      return worklog;
    });
  }

  update(id: number, updateWorkLogDto: UpdateWorkLogDto) {
    return `This action updates a #${id} workLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} workLog`;
  }
}
