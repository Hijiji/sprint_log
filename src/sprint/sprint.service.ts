import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
import { runInTransaction } from 'src/common/database/transaction.helper';
import { Sprint } from 'src/database/entities/sprint.entity';

@Injectable()
export class SprintService {
  constructor(private readonly dataSource: DataSource) {}

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

  findAll() {
    return `This action returns all sprint`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sprint`;
  }

  update(id: number, updateSprintDto: UpdateSprintDto) {
    return `This action updates a #${id} sprint`;
  }

  remove(id: number) {
    return `This action removes a #${id} sprint`;
  }
}
