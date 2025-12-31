import { Injectable } from '@nestjs/common';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { Sprint } from '../database/entities/sprint.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from 'src/database/entities/member.entity';

@Injectable()
export class SprintRepository {
  constructor(
    @InjectRepository(Sprint) private sprint: Repository<Sprint>,
    @InjectRepository(Member) private member: Repository<Member>,
  ) {}
  create(createSprintDto: CreateSprintDto) {
    return 'This action adds a new sprint';
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
