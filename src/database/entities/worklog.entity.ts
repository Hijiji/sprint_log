import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Task } from './task.entity';

@Entity('worklogs')
export class WorkLog {
  @PrimaryGeneratedColumn('uuid')
  workLogId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  contents: string;

  @Column({ type: 'date' })
  createdAt: Date;

  @Column({ type: 'datetime' })
  workTime: Date;

  @Column({ type: 'date' })
  workDate: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Task, (task) => task.worklog)
  task: Task;

  @ManyToOne(() => Member)
  member: Member;
}
