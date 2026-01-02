import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { CursorDto } from 'src/common/dto/cursor.dto';

export class FindAllTaskDto extends CursorDto {
  @ApiProperty({
    enum: TaskStatusEnum,
    required: false,
    description: '조회하고픈 업무 상태',
  })
  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum;

  @ApiProperty({
    example: '스프린트명',
    required: false,
    description: '조회하려는 스프린트 제목으로 필터링',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  sprintTitle?: string;

  @ApiProperty({
    example: '담당자명',
    required: false,
    description: '조회하고픈 담당자 이름',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  memberName?: string;

  @ApiProperty({
    example: '업무명',
    required: false,
    description: '조회하려는 업무 제목',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  taskTitle?: string;
}
