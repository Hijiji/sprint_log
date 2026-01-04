import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WorkLogIdDto {
  @ApiProperty({
    description: '업무일지 ID',
    example: 'worklog-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}
