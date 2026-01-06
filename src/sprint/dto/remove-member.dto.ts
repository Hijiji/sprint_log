import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveMemberDto {
  @ApiProperty({
    example: 'member-001',
    description: '제거할 사용자 ID',
  })
  @IsString()
  @IsNotEmpty()
  memberId: string;
}
