import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Sprint } from './sprint.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { TaskPriorityEnum } from 'src/common/enum/task-priotity.enum';
import { Task } from './task.entity';

@Entity('worklogs')
export class WorkLog {
  @PrimaryGeneratedColumn('uuid')
  workLogId: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  contents: string;

  @Column({ type: 'varchar', length: 50 })
  status: TaskStatusEnum;

  @Column({ type: 'date' })
  createdAt: Date;

  @Column({ type: 'datetime' })
  workTime: Date;

  @Column({ type: 'date' })
  workDate: Date;

  @Column({ type: 'boolean' })
  isDeleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Task, (task) => task.worklog)
  task: Task;

  @OneToOne(() => Member, (member) => member.worklog)
  member: Member;
}
