import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class MemberIdDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 'member-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

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
    example: '2026-02',
    required: false,
    description: '조회하려는 년월, YYYY-MM 형식의 문자열',
  })
  @IsString()
  @IsOptional()
  @Matches(/^$|^\d{4}-\d{2}/)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  yearAndMonth?: string;
}
