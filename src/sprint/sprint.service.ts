import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, In } from 'typeorm';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { FindAllSprintDto } from './dto/find-all-sprint.dto';
import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
import { runInTransaction } from 'src/common/transaction/transaction.helper';
import { validateDateRange } from 'src/common/utils/date.utils';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Task } from 'src/database/entities/task.entity';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { SprintIdDto } from './dto/sprint-id-dto';
import { Member } from 'src/database/entities/member.entity';
import { SprintManagerLink } from 'src/database/entities/sprint-manager-links.entity';

@Injectable()
export class SprintService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 스프린트 하나 생성
   * @param createSprintDto
   * @returns
   */
  async create(createSprintDto: CreateSprintDto) {
    // 날짜 검증
    validateDateRange(createSprintDto.startDate, createSprintDto.endDate);

    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);
      const memberRepository = manager.getRepository(Member);
      const sprintManagerLinkRepository =
        manager.getRepository(SprintManagerLink);

      // Sprint 생성
      const sprint = sprintRepository.create({
        title: createSprintDto.title,
        description: createSprintDto.description || '',
        startDate: createSprintDto.startDate || null,
        endDate: createSprintDto.endDate || null,
        status: createSprintDto.status || SprintStatusEnum.PLANNED,
      });

      const savedSprint = await sprintRepository.save(sprint);

      // 멤버 할당
      if (createSprintDto.members && createSprintDto.members.length > 0) {
        const members = await memberRepository.find({
          where: { memberId: In(createSprintDto.members.map((id) => id)) },
        });

        if (members.length !== createSprintDto.members.length) {
          throw new BadRequestException(
            '할당된 멤버 중 존재하지 않는 사용자가 있습니다.',
          );
        }

        // 일괄 생성
        const sprintManagerLinks = members.map((member) =>
          sprintManagerLinkRepository.create({
            sprint: savedSprint,
            member,
          }),
        );

        await sprintManagerLinkRepository.save(sprintManagerLinks);

        return { sprint: savedSprint, members };
      }

      return { sprint: savedSprint, members: [] };
    });
  }

  /**
   * 스프린트 목록 조회 (페이지네이션)
   * @param findAllSprintDto
   * @returns
   */
  async findAll(findAllSprintDto: FindAllSprintDto) {
    const defaultLimit = this.configService.get<number>(
      'pagination.defaultLimit',
    );
    const offset = findAllSprintDto.offset ?? 0;
    const limit = findAllSprintDto.limit ?? defaultLimit;

    const sprintRepository = this.dataSource.getRepository(Sprint);

    const [sprints, total] = await sprintRepository.findAndCount({
      select: {
        sprintId: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
      },
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      sprints,
      meta: PaginationMetaDto.create(total, offset, limit),
    };
  }

  /**
   * 스프린트 상세 조회 (하위 업무목록 포함)
   * @param sprintIdDto
   * @returns
   */
  async findOne(sprintIdDto: SprintIdDto) {
    const sprintRepository = this.dataSource.getRepository(Sprint);
    const sprint = await sprintRepository.findOne({
      select: {
        sprintId: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        isDeleted: true,
        tasks: {
          taskId: true,
          title: true,
          status: true,
        },
      },
      where: { sprintId: sprintIdDto.id, isDeleted: false },
      relations: ['tasks'],
    });

    if (!sprint) {
      throw new BadRequestException('존재하지 않는 스프린트입니다.');
    }

    return sprint;
  }

  /**
   * 스프린트 정보 수정
   * @param sprintIdDto
   * @param updateSprintDto
   * @returns
   */
  async update(sprintIdDto: SprintIdDto, updateSprintDto: UpdateSprintDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);

      const sprint = await sprintRepository.findOne({
        where: { sprintId: sprintIdDto.id, isDeleted: false },
      });

      if (!sprint) {
        throw new BadRequestException('존재하지 않는 스프린트입니다.');
      }

      // 날짜 검증
      validateDateRange(updateSprintDto.startDate, updateSprintDto.endDate);

      // 필드 업데이트
      if (updateSprintDto.title !== undefined)
        sprint.title = updateSprintDto.title;
      if (updateSprintDto.description !== undefined)
        sprint.description = updateSprintDto.description;
      if (updateSprintDto.startDate !== undefined)
        sprint.startDate = updateSprintDto.startDate;
      if (updateSprintDto.endDate !== undefined)
        sprint.endDate = updateSprintDto.endDate;

      // 상태 변경에 따른 날짜 자동 설정
      if (updateSprintDto.status !== undefined) {
        if (
          updateSprintDto.status === SprintStatusEnum.ACTIVE &&
          sprint.status !== SprintStatusEnum.ACTIVE
        ) {
          sprint.startDate = new Date();
        }
        if (
          updateSprintDto.status === SprintStatusEnum.COMPLETED &&
          sprint.status !== SprintStatusEnum.COMPLETED
        ) {
          sprint.endDate = new Date();
        }
        sprint.status = updateSprintDto.status;
      }
      return sprintRepository.save(sprint);
    });
  }

  /**
   * 스프린트 삭제 - soft delete
   * @param sprintIdDto
   * @returns
   */
  async remove(sprintIdDto: SprintIdDto, removeWithTasks: boolean) {
    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);
      const taskRepository = manager.getRepository(Task);

      const sprint = await sprintRepository.findOne({
        where: { sprintId: sprintIdDto.id, isDeleted: false },
      });

      if (!sprint) {
        throw new BadRequestException('존재하지 않는 스프린트입니다.');
      }

      if (removeWithTasks) {
        // 백로그로 이동
        await taskRepository.update(
          { sprint: { sprintId: sprintIdDto.id }, isDeleted: false },
          { isBackLog: true, sprint: null },
        );
      }

      sprint.isDeleted = true;
      sprint.deletedAt = new Date();
      return sprintRepository.save(sprint);
    });
  }

  /**
   * 스프린트 시작 - status : 진행중, startDate: 현재일, endDate: null
   * @param sprintIdDto
   * @returns
   */
  async sprintStart(sprintIdDto: SprintIdDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);

      const sprint = await sprintRepository.findOne({
        where: { sprintId: sprintIdDto.id, isDeleted: false },
      });

      if (!sprint) {
        throw new BadRequestException('존재하지 않는 스프린트입니다.');
      }

      sprint.status = SprintStatusEnum.ACTIVE;
      sprint.startDate = new Date();
      sprint.endDate = null;
      return sprintRepository.save(sprint);
    });
  }

  /**
   * 스프린트 종료 - status : 완료, endDate: 현재일
   * @param sprintIdDto
   * @returns
   */
  async sprintEnd(sprintIdDto: SprintIdDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);
      const taskRepository = manager.getRepository(Task);

      const sprint = await sprintRepository.findOne({
        where: { sprintId: sprintIdDto.id, isDeleted: false },
      });

      if (!sprint) {
        throw new BadRequestException('존재하지 않는 스프린트입니다.');
      }

      // 미완료 업무 백로그로 이동
      await taskRepository.update(
        { sprint: { sprintId: sprintIdDto.id }, isDeleted: false },
        { isBackLog: true, sprint: null },
      );

      sprint.status = SprintStatusEnum.COMPLETED;
      sprint.endDate = new Date();
      return sprintRepository.save(sprint);
    });
  }
}
