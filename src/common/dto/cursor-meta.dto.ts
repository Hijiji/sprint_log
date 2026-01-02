import { ApiProperty } from '@nestjs/swagger';

export class TaskCursorMetaDto {
  @ApiProperty({
    example: 'task-uuid-456',
    required: false,
    description: '다음 페이지의 시작점 (없으면 마지막 페이지)',
  })
  nextCursor?: string;

  @ApiProperty({
    example: true,
    description: '다음 페이지 존재 여부',
  })
  hasNextPage: boolean;

  @ApiProperty({
    example: 10,
    description: '조회한 개수',
  })
  limit: number;

  static create(tasks: any[], limit: number): TaskCursorMetaDto {
    const hasNextPage = tasks.length > limit;
    const nextCursor = hasNextPage ? tasks[limit - 1]?.taskId : undefined;

    return {
      nextCursor,
      hasNextPage,
      limit: Math.min(tasks.length, limit), //실제 반환한 갯수
    };
  }
}
