import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
export class UpdateSprintDto {
  @ApiProperty({ example: '2026년 01월 인사시스템 개발', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({
    example: '스프린트에 대한 설명을 입력하세요.',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  @ApiProperty({
    example: '2026-01-02',
    description: '스프린트 시작 일자, YYYY-MM-DD 형식의 문자열',
  })
  @IsString()
  @IsOptional()
  @Matches(/^$|^\d{4}-\d{2}-\d{2}$/)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  startDate: string;

  @ApiProperty({
    example: '2026-02-02',
    description: '스프린트 종료일자, YYYY-MM-DD 형식의 문자열',
  })
  @IsString()
  @IsOptional()
  @Matches(/^$|^\d{4}-\d{2}-\d{2}$/)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  endDate: string;

  @ApiProperty({
    enum: SprintStatusEnum,
    example: SprintStatusEnum.PLANNED,
    description: `스프린트 상태 할일 : ${SprintStatusEnum.PLANNED}, 진행중 : ${SprintStatusEnum.ACTIVE}, 완료 : ${SprintStatusEnum.COMPLETED}, 보류 : ${SprintStatusEnum.HOLD}`,
  })
  @IsOptional()
  @IsEnum(SprintStatusEnum)
  status: SprintStatusEnum;
}
