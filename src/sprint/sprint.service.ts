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

    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);

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
    });
  }

  /**
   * 스프린트 단건 조회
   * @param sprintIdDto - 스프린트 ID
   * @returns
   */
  async findOne(sprintIdDto: SprintIdDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const sprintRepository = manager.getRepository(Sprint);
      const sprint = await sprintRepository.findOne({
        where: { sprintId: sprintIdDto.id, isDeleted: false },
      });

      if (!sprint) {
        throw new BadRequestException('존재하지 않는 스프린트입니다.');
      }

      return sprint;
    });
  }

  update(id: number, updateSprintDto: UpdateSprintDto) {
    return `This action updates a #${id} sprint`;
  }

  remove(id: number) {
    return `This action removes a #${id} sprint`;
  }
}
