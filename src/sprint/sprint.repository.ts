import { Injectable } from '@nestjs/common';
import { Sprint } from '../database/entities/sprint.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from 'src/database/entities/member.entity';

@Injectable()
export class SprintRepository {
  constructor(
    @InjectRepository(Sprint) private sprint: Repository<Sprint>,
    @InjectRepository(Member) private member: Repository<Member>,
  ) {}
}
