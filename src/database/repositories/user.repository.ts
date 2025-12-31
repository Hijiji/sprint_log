import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(Member)
    private readonly userRepository: Repository<Member>,
  ) {}

  async findAll(): Promise<Member[]> {
    return this.userRepository.find();
  }

  async findById(memberId: string): Promise<Member | null> {
    return this.userRepository.findOne({ where: { memberId } });
  }

  async findByEmail(email: string): Promise<Member | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<Member>): Promise<Member> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<Member>): Promise<Member> {
    await this.userRepository.update(id, userData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected > 0;
  }

  async findActive(): Promise<Member[]> {
    return this.userRepository.find({ where: { isEmployed: true } });
  }
}
