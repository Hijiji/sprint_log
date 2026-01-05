import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MemberDto {
  @ApiProperty({
    example: 'member-123',
    description: '사용자 ID',
  })
  @IsString()
  @IsNotEmpty()
  memberId: string;
}
