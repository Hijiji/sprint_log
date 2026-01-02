import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskPriorityEnum } from 'src/common/enum/task-priotity.enum';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ example: '2026년 01월 인사시스템 개발', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({
    example: '업무에 대한 설명을 입력하세요.',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  status: TaskStatusEnum;

  @ApiProperty({
    example: '2026-01-02',
    description: '업무 시작 예정일, YYYY-MM-DD 형식의 문자열',
  })
  @IsString()
  @IsOptional()
  @Matches(/^$|^\d{4}-\d{2}-\d{2}$/)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  expectedStartDate: Date;

  @ApiProperty({
    example: '2026-02-02',
    description: '업무 종료 예정일, YYYY-MM-DD 형식의 문자열',
  })
  @IsString()
  @IsOptional()
  @Matches(/^$|^\d{4}-\d{2}-\d{2}$/)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  expectedEndDate: Date;

  @ApiProperty({
    example: '4',
    description: '예상 작업시간',
  })
  @IsNumber()
  @IsOptional()
  expectedWorkTime: number;

  @ApiProperty({
    enum: TaskPriorityEnum,
    example: TaskPriorityEnum.MEDIUM,
    description: `업무 중요도   매우급함 : ${TaskPriorityEnum.CRITICAL}, 급함 : ${TaskPriorityEnum.HIGH}, 낮음 : ${TaskPriorityEnum.LOW}, 보통 : ${TaskPriorityEnum.MEDIUM}`,
  })
  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority: TaskPriorityEnum;

  @ApiProperty({
    example: 'sprint-123',
    description: '스프린트 ID',
  })
  @IsString()
  @IsOptional()
  sprintId: string;

  @ApiProperty({
    example: 'member-456',
    description: '사용자 ID',
  })
  @IsString()
  @IsOptional()
  memberId: string;
}
