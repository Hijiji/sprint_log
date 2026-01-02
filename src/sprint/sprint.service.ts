import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { FindAllSprintDto } from './dto/find-all-sprint.dto';
import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
import { runInTransaction } from 'src/common/database/transaction.helper';
import { Sprint } from 'src/database/entities/sprint.entity';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { SprintIdDto } from './dto/sprint-id-dto';

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
    const sprintData = {
      title: createSprintDto.title,
      description: createSprintDto.description || '',
      startDate: createSprintDto.startDate || null,
      endDate: createSprintDto.endDate || null,
      status: createSprintDto.status || SprintStatusEnum.PLANNED,

      createdAt: new Date(),
      isDeleted: false,
      deletedAt: null,
    };

    if (sprintData.startDate && sprintData.endDate) {
      const startDate = new Date(sprintData.startDate);
      const endDate = new Date(sprintData.endDate);
      if (startDate > endDate) {
        throw new BadRequestException('종료일은 시작일보다 늦어야 합니다.');
      }
    }

    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);
      return sprintRepository.save(sprintData);
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
   * 스프린트 단건 조회
   * @param sprintIdDto
   * @returns
   */
  async findOne(sprintIdDto: SprintIdDto) {
    const sprintRepository = this.dataSource.getRepository(Sprint);
    const sprint = await sprintRepository.findOne({
      where: { sprintId: sprintIdDto.id, isDeleted: false },
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

      if (updateSprintDto.startDate && updateSprintDto.endDate) {
        const startDate = new Date(updateSprintDto.startDate);
        const endDate = new Date(updateSprintDto.endDate);
        if (startDate > endDate) {
          throw new BadRequestException('종료일은 시작일보다 늦어야 합니다.');
        }
      }

      const startDate = updateSprintDto.startDate
        ? new Date(updateSprintDto.startDate)
        : undefined;

      const endDate = updateSprintDto.endDate
        ? new Date(updateSprintDto.endDate)
        : undefined;

      if (updateSprintDto.title !== undefined) {
        sprint.title = updateSprintDto.title;
      }
      if (updateSprintDto.description !== undefined) {
        sprint.description = updateSprintDto.description;
      }
      if (startDate !== undefined) {
        sprint.startDate = startDate || null;
      }
      if (updateSprintDto.endDate !== undefined) {
        sprint.endDate = endDate || null;
      }
      if (updateSprintDto.status !== undefined) {
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
  async remove(sprintIdDto: SprintIdDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);

      const sprint = await sprintRepository.findOne({
        where: { sprintId: sprintIdDto.id, isDeleted: false },
      });

      if (!sprint) {
        throw new BadRequestException('존재하지 않는 스프린트입니다.');
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
   * todo : 미완료 업무 백로그로 이동
   * @param sprintIdDto
   * @returns
   */
  async sprintEnd(sprintIdDto: SprintIdDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);

      const sprint = await sprintRepository.findOne({
        where: { sprintId: sprintIdDto.id, isDeleted: false },
      });

      if (!sprint) {
        throw new BadRequestException('존재하지 않는 스프린트입니다.');
      }

      sprint.status = SprintStatusEnum.COMPLETED;
      sprint.endDate = new Date();
      return sprintRepository.save(sprint);
    });
  }
}
