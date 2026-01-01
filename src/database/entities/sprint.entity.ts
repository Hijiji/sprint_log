import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SprintManagerLink } from './sprint-manager-links.entity';
import { Task } from './task.entity';
import { WorkLog } from './worklog.entity';

@Entity('sprints')
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  sprintId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  status: SprintStatusEnum;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'boolean' })
  isDeleted: boolean;

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
