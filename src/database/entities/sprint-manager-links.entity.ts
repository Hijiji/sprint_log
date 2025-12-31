import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from './member.entity';
import { Sprint } from './sprint.entity';

@Entity('sprintManagerLinks')
export class SprintManagerLink {
  @PrimaryGeneratedColumn('uuid')
  smlId: string;
  @ManyToOne(() => Sprint, (sprint) => sprint.sprintManagerLinks)
  sprint: Sprint;
  @ManyToOne(() => Member, (member) => member.sprintManagerLinks)
  member: Member;
}
