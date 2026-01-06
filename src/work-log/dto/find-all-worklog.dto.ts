import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FindAllWorklogDto extends PaginationDto {
  @ApiProperty({
    example: '2026-01-02',
    required: false,
    description:
      '조회하려는 업무로그를 날짜로 필터링, YYYY-MM-DD 형식의 문자열',
  })
  @IsString()
  @IsOptional()
  @Matches(/^$|^\d{4}-\d{2}-\d{2}$/)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  workDate?: Date;

  @ApiProperty({
    example: '담당자명',
    required: false,
    description: '검색/조회하고픈 담당자 이름',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  memberName?: string;

  @ApiProperty({
    example: '업무명',
    required: false,
    description: '검색/조회하려는 업무 제목',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  taskTitle?: string;

  @ApiProperty({
    example: '담당자 ID',
    required: false,
    description: '필터/조회하고픈 담당자 ID',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  memberId?: string;

  @ApiProperty({
    example: '업무 ID',
    required: false,
    description: '필터/조회하려는 업무 ID',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  taskId?: string;
}
