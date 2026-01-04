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
export class CreateWorkLogDto {
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
  contents: string;

  @ApiProperty({
    example: '2026-01-02',
    description: '업무일, YYYY-MM-DD 형식의 문자열',
  })
  @IsString()
  @IsOptional()
  @Matches(/^$|^\d{4}-\d{2}-\d{2}$/)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  workDate: Date;

  @ApiProperty({
    example: '4',
    description: '작업시간',
  })
  @IsNumber()
  @IsOptional()
  workTime: number;

  @ApiProperty({
    example: 'task-123',
    description: '업무 ID',
  })
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({
    example: 'member-456',
    description: '사용자 ID',
  })
  @IsString()
  @IsNotEmpty()
  memberId: string;
}
