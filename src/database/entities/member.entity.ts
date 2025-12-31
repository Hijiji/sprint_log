import { Sprint } from 'src/database/entities/sprint.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { SprintManagerLink } from './sprint-manager-links.entity';
import { Task } from './task.entity';
import { WorkLog } from './worklog.entity';

@Entity('members')
@Index(['email'], { unique: true })
export class Member {
  @PrimaryGeneratedColumn('uuid')
  memberId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  team: string;

  @Column({ type: 'boolean', default: true })
  isEmployed: boolean;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => SprintManagerLink,
    (sprintManagerLink) => sprintManagerLink.member,
  )
  sprintManagerLinks: SprintManagerLink[];

  @ManyToOne(() => Task, (task) => task.members)
  tasks: Task;

  @OneToOne(() => WorkLog, (worklog) => worklog.member)
  worklog: WorkLog;
}
