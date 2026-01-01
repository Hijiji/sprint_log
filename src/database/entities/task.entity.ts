import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Sprint } from './sprint.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { taskPriorityEnum } from 'src/common/enum/task-priotity.enum';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  taskId: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  status: TaskStatusEnum;

  @Column({ type: 'date' })
  createdAt: Date;

  @Column({ type: 'date' })
  updatedAt: Date;

  @Column({ type: 'date' })
  expectedStartDate: Date;

  @Column({ type: 'date' })
  expectedEndDate: Date;

  @Column({ type: 'datetime' })
  expectedWorkTime: Date;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'boolean' })
  isBackLog: boolean;

  @Column({ type: 'varchar', length: 50 })
  priority: taskPriorityEnum;

  @Column({ type: 'boolean' })
  isDeleted: boolean;

  @ManyToOne(() => Sprint, (sprint) => sprint.tasks)
  sprint: Sprint;

  @OneToMany(() => Member, (member) => member.tasks)
  members: Member[];
}
