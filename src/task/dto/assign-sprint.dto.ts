import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignSprintDto {
  @ApiProperty({
    example: 'sprint-123',
    description: '스프린트 ID',
  })
  @IsNotEmpty()
  @IsString()
  sprintId: string;
}
