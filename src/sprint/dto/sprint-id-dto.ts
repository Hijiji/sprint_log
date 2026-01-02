import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SprintIdDto {
  @ApiProperty({
    description: '스프린트 ID',
    example: 'sprint-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}
