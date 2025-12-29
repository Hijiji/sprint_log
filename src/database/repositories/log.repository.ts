import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../entities/log.entity';

@Injectable()
export class LogRepository {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
  ) {}

  async create(logData: Partial<Log>): Promise<Log> {
    const log = this.logRepository.create(logData);
    return this.logRepository.save(log);
  }

  async findAll(): Promise<Log[]> {
    return this.logRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByLevel(level: string): Promise<Log[]> {
    return this.logRepository.find({
      where: { level },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<Log[]> {
    return this.logRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Log[]> {
    return this.logRepository
      .createQueryBuilder('log')
      .where('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('log.createdAt', 'DESC')
      .getMany();
  }

  async deleteOlderThan(days: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await this.logRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :date', { date })
      .execute();

    return result.affected || 0;
  }
}
