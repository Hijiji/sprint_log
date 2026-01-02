import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CursorDto {
  @ApiProperty({
    example: 'item-uuid-123',
    required: false,
    description: 'Cursor 기반 페이징 - 이전 페이지의 마지막 ID',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    example: 10,
    required: false,
    description: '한 페이지당 조회 개수 (기본값: 10)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 10 : num;
  })
  limit?: number;
}
