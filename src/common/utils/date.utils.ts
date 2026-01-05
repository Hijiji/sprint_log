import { BadRequestException } from '@nestjs/common';

/**
 * 스프린트/업무의 시작일과 종료일 검증
 * @param startDate 시작일
 * @param endDate 종료일
 * @throws BadRequestException 종료일이 시작일보다 이전인 경우
 */
export function validateDateRange(
  startDate?: Date | string,
  endDate?: Date | string,
): void {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new BadRequestException('종료일은 시작일보다 늦어야 합니다.');
    }
  }
}

/**
 * 날짜 문자열을 Date 객체로 변환 (유효성 검사)
 * @param dateStr 날짜 문자열 (YYYY-MM-DD 형식)
 * @returns Date 객체 또는 null
 */
export function parseDate(dateStr?: string | Date): Date | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new BadRequestException('유효하지 않은 날짜 형식입니다.');
  }

  return date;
}
