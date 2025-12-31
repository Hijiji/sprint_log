import { Sprint } from 'src/database/entities/sprint.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';

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

  @ManyToOne(() => Sprint, (sprint) => sprint.members)
  sprint: Sprint;
}
