import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TaskIdDto {
  @ApiProperty({
    description: '업무 ID',
    example: 'task-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}
