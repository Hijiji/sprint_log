import { Member } from 'src/database/entities/member.entity';
import { SprintStatus } from 'src/enum/sprint.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sprints')
@Index()
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  sprintId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'date' })
  expectedStartDate: Date;

  @Column({ type: 'date' })
  expectedEndDate: Date;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  status: SprintStatusEnum;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  isDeleted: boolean;

  @OneToMany(() => Member, (member) => member.sprint)
  members: Member[];
}
