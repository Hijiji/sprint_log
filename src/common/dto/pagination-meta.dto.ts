import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이지네이션 응답 DTO
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: '전체 레코드 개수',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: '현재 오프셋',
    example: 20,
  })
  offset: number;

  @ApiProperty({
    description: '페이지당 레코드 개수',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: '현재 페이지 (1부터 시작)',
    example: 3,
  })
  currentPage: number;

  @ApiProperty({
    description: '전체 페이지 수',
    example: 15,
  })
  totalPages: number;

  @ApiProperty({
    description: '다음 페이지 존재 여부',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: '이전 페이지 존재 여부',
    example: true,
  })
  hasPrevPage: boolean;

  /**
   * 페이지네이션 메타데이터 생성 정적 메서드
   * @param total 전체 레코드 개수
   * @param offset 오프셋
   * @param limit 페이지당 레코드 개수
   * @returns PaginationMetaDto 인스턴스
   */
  static create(
    total: number,
    offset: number,
    limit: number,
  ): PaginationMetaDto {
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    const meta = new PaginationMetaDto();
    meta.total = total;
    meta.offset = offset;
    meta.limit = limit;
    meta.currentPage = currentPage;
    meta.totalPages = totalPages;
    meta.hasNextPage = currentPage < totalPages;
    meta.hasPrevPage = currentPage > 1;

    return meta;
  }
}
