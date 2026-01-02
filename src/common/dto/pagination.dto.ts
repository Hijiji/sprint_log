import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이지네이션 요청 DTO
 * 다른 DTO에서 상속받아 사용
 */
export class PaginationDto {
  @ApiProperty({
    description: '건너뛸 레코드 수',
    example: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiProperty({
    description: '한 번에 조회할 레코드 수',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
