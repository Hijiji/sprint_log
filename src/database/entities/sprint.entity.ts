import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SprintManagerLink } from './sprint-manager-links.entity';
import { Task } from './task.entity';

@Entity('sprints')
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  sprintId: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: SprintStatusEnum.PLANNED })
  status: SprintStatusEnum;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @OneToMany(
    () => SprintManagerLink,
    (sprintManagerLinks) => sprintManagerLinks.sprint,
  )
  sprintManagerLinks: SprintManagerLink[];

  @OneToMany(() => Task, (task) => task.sprint)
  tasks: Task[];
}
