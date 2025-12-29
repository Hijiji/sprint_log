import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('logs')
@Index(['level'])
@Index(['createdAt'])
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  level: string; // 'error', 'warn', 'info', 'debug'

  @Column({ type: 'varchar', length: 255 })
  context: string; // 로그 컨텍스트 (클래스명, 함수명 등)

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON 형식의 추가 정보

  @Column({ type: 'varchar', length: 50, nullable: true })
  userId: string; // 관련 사용자 ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  endpoint: string; // API 엔드포인트

  @Column({ type: 'integer', nullable: true })
  statusCode: number; // HTTP 상태 코드

  @CreateDateColumn()
  createdAt: Date;
}
