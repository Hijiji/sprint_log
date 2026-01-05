/**
 * 애플리케이션 전체에서 사용하는 에러 메시지 상수
 */
export const ERROR_MESSAGES = {
  // Sprint 관련
  SPRINT_NOT_FOUND: '존재하지 않는 스프린트입니다.',
  SPRINT_MEMBER_NOT_FOUND: '할당된 멤버 중 존재하지 않는 사용자가 있습니다.',
  SPRINT_MEMBER_ALREADY_EXISTS: '이미 해당 스프린트에 할당된 사용자입니다.',
  SPRINT_MEMBER_NOT_ASSIGNED: '해당 스프린트에 할당되지 않은 사용자입니다.',

  // Task 관련
  TASK_NOT_FOUND: '존재하지 않는 업무입니다.',
  TASK_TITLE_REQUIRED: '업무 제목은 필수입니다.',

  // WorkLog 관련
  WORKLOG_NOT_FOUND: '존재하지 않는 업무일지입니다.',

  // Member 관련
  MEMBER_NOT_FOUND: '존재하지 않는 사용자입니다.',

  // Date 관련
  INVALID_DATE_RANGE: '종료일은 시작일보다 늦어야 합니다.',

  // General
  DATABASE_ERROR: '데이터베이스 오류가 발생했습니다.',
  INVALID_REQUEST: '잘못된 요청입니다.',
} as const;
