import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Sprint } from './sprint.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { TaskPriorityEnum } from 'src/common/enum/task-priotity.enum';
import { WorkLog } from './worklog.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  taskId: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: TaskStatusEnum.PLANNED })
  status: TaskStatusEnum;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    update: false,
  })
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  updatedAt: Date;

  @Column({ type: 'date', nullable: true })
  expectedStartDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedEndDate: Date;

  @Column({ type: 'int', default: 0, nullable: true })
  expectedWorkTime: number;

  @Column({ type: 'int', default: 0, nullable: true })
  snapshotExpectedWorkTime: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'boolean', default: true })
  isBackLog: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  priority: TaskPriorityEnum;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Sprint, (sprint) => sprint.tasks)
  sprint: Sprint;

  @OneToMany(() => WorkLog, (worklog) => worklog.task)
  worklogs: WorkLog[];

  @OneToOne(() => Member, (member) => member.task)
  @JoinColumn({ name: 'memberId' })
  member: Member;
}
