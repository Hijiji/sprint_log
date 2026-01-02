import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SprintManagerLink } from './sprint-manager-links.entity';
import { Task } from './task.entity';
import { WorkLog } from './worklog.entity';

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

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, default: SprintStatusEnum.PLANNED })
  status: SprintStatusEnum;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    update: false,
  })
  createdAt: Date;

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

  @OneToMany(() => WorkLog, (worklog) => worklog.sprint)
  worklog: WorkLog[];
}
