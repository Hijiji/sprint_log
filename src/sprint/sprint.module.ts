import { Module } from '@nestjs/common';
import { SprintService } from './sprint.service';
import { SprintController } from './sprint.controller';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Member } from 'src/database/entities/member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [SprintController],
  providers: [SprintService],
  imports: [TypeOrmModule.forFeature([Sprint, Member])],
})
export class SprintModule {}
