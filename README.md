**추가 자료**</br>
개발 일지 블로그 주소 : https://isjiji.tistory.com/category/Side%20Project/%ED%98%91%EC%97%85%EB%8F%84%EA%B5%AC%20%EA%B0%9C%EB%B0%9C%EB%A1%9C%EA%B7%B8</br>
erd cloud 주소 : https://www.erdcloud.com/d/2oLJsGufykQCYcf2e</br>
swagger 주소 : http://localhost:3000/sprint-api-docs</br>
github 주소 : https://github.com/Hijiji/sprint_log</br>
</br>
</br>

# Sprint Log - 스프린트 관리 및 작업 시간 추적 시스템

## 프로젝트 개요

Sprint Log는 스프린트 기반의 프로젝트 관리와 팀원의 작업 시간 추적을 위한 RESTful API 백엔드 시스템입니다.
스프린트 계획, 업무 할당, 작업 로그 기록 및 통계 분석을 관리합니다.

### 핵심 기능

- **스프린트 관리**: 스프린트 생성, 수정, 삭제 및 라이프사이클(계획→진행→완료) 관리
- **업무 관리**: 스프린트별 업무 생성, 할당, 상태 관리
- **작업 로그**: 팀원의 일일 작업 시간 및 활동 기록
- **통계 및 분석**: 스프린트별 진행률, 팀원별 업무 처리 현황, 업무별 시간 추적
- **API 문서화**: Swagger/OpenAPI를 통한 API 문서

## 기술 스택

### 백엔드 프레임워크

- **NestJS 10.x**: TypeScript 기반 웹 애플리케이션 프레임워크
- **TypeScript**: 타입 안정성과 개발 생산성 향상

### 데이터베이스

- **TypeORM 0.3.28**: Node.js/TypeScript ORM
- **SQLite3 / better-sqlite3**: 경량 관계형 데이터베이스

### API 및 문서화

- **Swagger**: 자동 생성되는 API 명세서
- **Supertest**: E2E 테스트

### 보안 및 유효성 검증

- **Helmet**: HTTP 헤더 보안
- **CORS**: 교차 출처 리소스 공유 정책
- **Class Validator**: DTO 유효성 검증
- **Joi**: 환경 변수 검증
- **Bcrypt**: 비밀번호 암호화

### 로깅 및 모니터링

- **Winston**: 구조화된 로깅
- **Winston Daily Rotate File**: 일일 로그 파일 회전

## 프로젝트 구조

```
src/
├── common/                     # 공통 기능
│   ├── constants/              # 에러 메시지 중앙화
│   ├── dto/                    # 공통 DTO (페이지네이션 등)
│   ├── enum/                   # 상태 및 우선순위 열거형
│   ├── filters/                # 전역 예외 필터
│   ├── interceptors/           # 요청/응답 인터셉터
│   ├── transaction/            # 트랜잭션 헬퍼
│   ├── utils/                  # 유틸리티 함수
│   ├── logger.ts               # Winston 로거 설정
│   └── encryption.service.ts   # 암호화 서비스
├── config/                     # 애플리케이션 설정
│   ├── configuration.ts        # 환경 설정
│   └── validation.ts           # 환경 검증
├── database/                   # 데이터베이스 계층
│   ├── data-source.ts          # TypeORM 데이터 소스
│   ├── entities/               # 데이터 엔티티
│   └── repositories/           # 데이터 접근 계층
├── sprint/                     # 스프린트 모듈
├── task/                       # 업무 모듈
├── work-log/                   # 작업 로그 모듈
├── statistics/                 # 통계 모듈
├── app.module.ts               # 루트 모듈
└── main.ts                     # 애플리케이션 진입점
test/
├── app.e2e-spec.ts            # E2E 테스트 스위트
└── jest-e2e.json              # Jest E2E 설정
```

## 로컬 설치 및 실행방법

### 로컬 실행 방법 (환경 설정 포함)

#### 1단계: 저장소 클론 및 의존성 설치

```bash
# 저장소 클론 or 압축파일
git clone https://github.com/Hijiji/sprint_log.git
cd sprint-log

# 의존성 설치
pnpm install
```

#### 2단계: 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다:

```bash
# .env 파일 생성
cat > .env << EOF
# 애플리케이션 설정
NODE_ENV=development
APP_NAME=sprint-log
APP_PORT=3000
APP_HOST=localhost

# 데이터베이스
DATABASE_PATH=./data/assignment.sqlite

# 로깅
LOG_LEVEL=info
LOG_DIR=./logs

# JWT (선택사항, 개발 환경에서는 필수 아님)
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d
EOF
```

**환경 변수 설명:**

| 변수명           | 설명                                    | 기본값                   | 필수여부            |
| ---------------- | --------------------------------------- | ------------------------ | ------------------- |
| `NODE_ENV`       | 실행 환경 (development/production/test) | development              | 선택                |
| `APP_NAME`       | 애플리케이션 이름                       | sprint-log               | 선택                |
| `APP_PORT`       | 서버 포트                               | 3000                     | 선택                |
| `APP_HOST`       | 서버 호스트                             | localhost                | 선택                |
| `DATABASE_PATH`  | SQLite 데이터베이스 경로                | ./data/assignment.sqlite | 선택                |
| `LOG_LEVEL`      | 로그 레벨 (error/warn/info/debug)       | info                     | 선택                |
| `LOG_DIR`        | 로그 파일 디렉토리                      | ./logs                   | 선택                |
| `JWT_SECRET`     | JWT 서명 키 (production에서 필수)       | (비어있음)               | production에서 필수 |
| `JWT_EXPIRATION` | JWT 만료 시간                           | 7d                       | 선택                |

**검증:**

모든 환경 변수는 `src/config/validation.ts`에서 **Joi 스키마**로 검증됩니다. 잘못된 값이 설정되면 애플리케이션 시작 시 오류가 발생합니다.

#### 3단계: 데이터베이스 초기화

```bash
# 데이터 디렉토리 생성
mkdir -p ./data ./logs

# 개발 모드에서 실행하면 자동으로 데이터베이스 테이블이 생성됩니다
```

**주의**: `NODE_ENV=development`일 때 TypeORM의 `synchronize: true` 옵션이 활성화되어 자동으로 엔티티 기반 테이블이 생성됩니다.

#### 4단계: 애플리케이션 실행

```bash
# 개발 모드 (파일 변경 시 자동 리로드)
pnpm run start:dev

# 디버그 모드
pnpm run start:debug

# 프로덕션 빌드
pnpm run build

# 프로덕션 실행
pnpm run start:prod
```

#### 5단계: API 테스트

애플리케이션이 시작되면 Swagger UI에서 API를 테스트할 수 있습니다:

```
http://localhost:3000/sprint-api-docs
```

## API 엔드포인트

### 스프린트 관리

- `POST /api/v1/sprint` - 스프린트 생성
- `GET /api/v1/sprint` - 스프린트 목록 조회 (페이지네이션)
- `GET /api/v1/sprint/:id` - 스프린트 상세 조회
- `PATCH /api/v1/sprint/:id` - 스프린트 정보 수정
- `DELETE /api/v1/sprint/:id` - 스프린트 삭제
- `POST /api/v1/sprint/:id/start` - 스프린트 시작
- `POST /api/v1/sprint/:id/complete` - 스프린트 완료
- `POST /api/v1/sprint/:id/members/:memberId` - 팀원 추가
- `DELETE /api/v1/sprint/:id/members/:memberId` - 팀원 제거

### 업무 관리

- `POST /api/v1/task` - 업무 생성
- `GET /api/v1/task` - 업무 목록 조회 (필터링, 페이지네이션)
- `GET /api/v1/task/:id` - 업무 상세 조회
- `PATCH /api/v1/task/:id` - 업무 정보 수정
- `DELETE /api/v1/task/:id` - 업무 삭제
- `POST /api/v1/task/:id/assign-sprint` - 스프린트 할당
- `DELETE /api/v1/task/:id/assign-sprint` - 스프린트 할당 제거

### 작업 로그

- `POST /api/v1/work-log` - 작업 로그 생성
- `GET /api/v1/work-log` - 작업 로그 목록 조회 (필터링, 페이지네이션)
- `GET /api/v1/work-log/:id` - 작업 로그 상세 조회
- `PATCH /api/v1/work-log/:id` - 작업 로그 수정
- `DELETE /api/v1/work-log/:id` - 작업 로그 삭제

### 통계 및 분석

- `GET /api/v1/statistics/sprints/:id` - 스프린트 통계 (완료율, 진행상황)
- `GET /api/v1/statistics/users/:id/summary` - 사용자 작업 요약
- `GET /api/v1/statistics/tasks/:id/time-tracking` - 업무별 시간 추적

## 구현 중 주요 고민 사항 및 해결 방법

**하단에 적은 고민외의 내용은 블로그에 개발일지를 작성하여 기록했습니다**</br>
**아래 링크를 확인해주세요**

```
https://isjiji.tistory.com/category/Side%20Project/%ED%98%91%EC%97%85%EB%8F%84%EA%B5%AC%20%EA%B0%9C%EB%B0%9C%EB%A1%9C%EA%B7%B8
```

### 1. **트랜잭션 처리: 데이터 일관성 보장**

#### 고민

Nestjs에서는 @Transaction 데코레이터 사용을 지양한다. 그렇기에 Transaction 관리가 필요할 때마다 DataSource를 호출하여 transaction을 start하고, 상황에 따라 rollback-commit 할 수 있도록 코딩을해야한다.
이로인해 transaction관리가 필요한 소스코드마다 동일한 코드를 중복 사용하게되고 service 로직의 가독성 또한 떨어진다. 이를 해결하기 위해서 transaction을 관리하는 헬퍼 함수를 구현해 중복을 줄이고 가독성을 높이고자 했다.
처음에는 interceptor를 사용해 transaction관리를 하려고했으나, interceptor는 service계층만 관리하지 않고 controller계층부터 감싸기 때문에 transaction이 필요하지 않은 지점까지 오버 매니징을 하게되어 interceptor 대신 별도의 함수를 구현했다.
그렇게 여러 엔티티의 변경 작업 중 오류가 발생하면 해당 서비스로직만 관리하는 헬퍼 함수를 사용하여 모든 변경이 함께 커밋-롤백 되어 데이터의 일관성이 유직되고 에러 복구가 자동화되게 하였다.

### 2. **페이지네이션 전략: Cursor vs Offset**

#### 고민

대용량데이터 조회시 성능과 사용자 경험을 모두 고려해야한다고 생각해 offset 방식과 Cursor 방식을 두고 고민했다.
sprint목록조회 API의 경우에는 대개 처음 조회할 때, 조건없이 프로그램에 있는 전체 스프린트를 조회할 것이라 생각했다. 또한 계속 쌓이는 데이터이고 월별로 관리할것이기에 상대적으로 과거에 생성한 스프린트는 자주 조회되지 않을 것이라 생각했으며 스프린트 데이터를 스크롤로 찾는것은 사용자가 불편할것이라 생각하였다. 그렇기에 앞데이터를 조회할 때에는 성능이 중요하지 않으며 사용자들이 데이터를 찾기 편한 방식인 offset방식을 사용하였다.  
반대로 업무관리 목록을 조회할 때에는 스프린트 하위에 있는 데이터를 조회할것이고, 스프린트 하위에 상대적으로 적은 양의 업무관리가 등록될것이라 생각하여 cursor방식을 사용하여 업무관리 목록을 조회되게끔 구현했다.

하지만 구현이 완료된 지금, 스프린트-업무관리-업무일지 전부 offset방식으로 사용하는것이 좋다고 생각이 들었다. 그 이유는 업무관리목록은 스프린트 하위에서만 조회되는것이 아닌 백로그목록으로도 조회될 수 있기 때문이다. 또한 조회-검색 기능이 있고 스크롤형식으로 무한정 늘어날 경우 사용자가 데이터를 찾고 접근하는 것이 불편할것이라고 생각이 들었다.
대신 스프린트-업무과제 와같이 상위 데이터를 기준으로 하위데이터도 같이 조회할 때에는 cursor를 사용해 스크롤형식으로 빠르게 조회되게 하는것이 좋을것 같다.

---

### 3. **Soft Delete 구현 - casecade**

#### 고민

데이터 삭제에 대해서는 전부 논리적 삭제를 하는것이 요구사항이었기 때문에 DB를 데이터를 삭제하지않고 deleted 여부를 관리하는 컬럼을 정해 해당 컬럼의 값만 변경하도록 구현했다.
문제는 삭제되는 데이터와 연결된 하위 데이터를 casecade 할 것인가에 대한 것이었다.
스프린트 하위에 있는 업무는 백로그로 관리할 수도 있기에, 스프린트가 삭제되면 하위 업무들은 백로그로 이동하게 구현하였다.
업무 하위에 있는 업무일지는 업무에 대한 개인의 기록이기 때문에 삭제되어서는 안된다고생각했으나, 요구사항에 업무일지는 반드시 하나의 업무에 할당되어야한다는 내용이 있어 업무가 삭제되면 업무일지 또한 관리할 수 없게된다고 정리되었다. 하지만 업무일지는 업무에 대한 기록을 남기는 가장 중요한 팩트자료이기 때문에 관련 endpoint를 다양하게 만들어 기획이 구체화되면 선택하여 사용할 수 있게 만들고자했다. 그래서 업무를 삭제하면 업무일지도 한번에 같이 삭제되는 API, 업무일지는 두고 업무만 삭제되는 API를 각각 만들었고, 업무를 삭제하기 전에 업무일지가 존재하는지에 대해 먼저 확인할 수 있도록 검사하는 API를 추가로 만들었다.
또한 지금생각해보니, soft delete된 데이터는 deleted 컬럼 값만 변경하는 것이 아닌 deleted data만 별도로 관리하는 entity 를 추가해 삭제된 데이터 로우를 옮기는 것이 데이터를 단일성있게 관리하는데 도움이 될것같다.

---

### 4. **Logging Interceptor, Response Interceptor, HttpException Filter**

#### 고민

Logging Interceptor : 들어오는 모든 요청과 응답을 추적할 수 있어야, 서비스에 대한 오류 디버깅이나 보안관리가 가능하기 때문에 Logging만 하는 Interceptor를 만들어 기록하게했다. 모든 HTTP 요청과 응답을 기록한다.
Response Interceptor : 반환되는 응답 데이터 포맷이 일정해야 프론트단에서 데이터를 일관적으로 처리할 수 있기에 모든 API 응답을 통일된 형식으로 제공하고자 했고, 이를 Response Interceptor를 만들어 관리하고자했다. 또한 응답할 때마다 작성해야하는 응답포맷의 중복 작성을 막고 자동으로 포매팅을 할 수 있다. logging Interceptor와 구분한 이유는 역할이 다르기에 단일성을 주기위해 구분하였다.
HttpException Filter : 모든 예외를 가장 바깥에 있는 라이프 사이클에서 캡쳐하고 일관된 포멧으로 기록하기 위해 Filter를 사용해 예외처리를 하도록 했다. 어떤 형태의 예외가 발생하든 일관되게 추출하고, HttpException뿐만 아니라 모든 예외를 캡쳐한다.

---

### 5. **그 외 고민**

1. 반복되는 패턴은 함수로 분리해 중복을 줄이고 가독성을 높이고자함
2. 스프린트 관리포인트가 현재는 월별이지만, 차후에 프로젝트가 다양해지면 프로젝트별로 스프린트를 관리하게될 수도 있어 두개를 동시에 관리할 수 있도록 확장가능성을 열어두어야한다고 생각함
3. 우선순위는 넘버링으로 하지않음. 업무를 순차적으로 넘버링을하면, 우선순위를 바꿀때마다 복잡해질것이라 생각함. 그래서 업무관리툴인 zira를 참고하여 문자로 우선순위를 관리하게 구현함
4. ERROR_MESSAGES를 상수로 만들어 일관되게 사용하게함. 이로인해 중복을 줄이고 에러 메세지 관리포인트를 하나로 모아 차후 메세지 변경시 적용에 용이하게 하고자함
5. repository의 필요성에 대한 고민을 많이함. 이전에 nest로 개발할때에도 repository를 만들어 레이어를 한번 더 나눴는데, 공식문서에서도 repository를 별도로 선언하지않고 다른 nestjs 작업물들을 찾아보아도 repository를 구분하는 경우는 많지 않았음. 그래서 이번 프로젝트는 repository 레이어를 추가하지 않았음. 하지만 repository 코드가 service 코드와 겹치니 가독성이 떨어지고 코드가 많이 길어졌음. 이에 repository를 구분하여 사용하는것에 필요성을 느꼈음.
6. 목록 조회기능에 검색, 필터 기능을 한번에 넣음. 하나의 API로 전체조회-검색-필터링 전부 할 수 있게 구현함
7. 서비스단에서 발생할 수 있는 오류를 최소화하기 위해서 단위 테스트와 E2E 테스트코드를 작성하여 test하며 개발진행함
8. seedInitialData를 구현하여 테스트에 필요한 데이터를 서버가 초기화 될때 추가되게 구현함

## 데이터베이스 스키마

**ERD가 작성된 erdCloud 링크 입니다.**

```
https://www.erdcloud.com/d/2oLJsGufykQCYcf2e
```

**erd 이미지 파일 경로입니다.**

```
sprint-log/erd.png
```

**DB 주요관계 요약:**

- **Sprint ↔ Task**: OneToMany (1개 스프린트 → N개 업무)
- **Sprint ↔ Member**: ManyToMany (N : M, through 'SprintManagerLink')
- **Member ↔ Task**: OneToMany (1명 팀원 → N개 업무)
- **Member ↔ WorkLog**: OneToMany (1명 팀원 → N개 작업 로그)
- **Task ↔ WorkLog**: OneToMany (1개 업무 → N개 작업 로그)

## 보너스 기능 구현 내역

### **업무 검색**

1. 업무관리, 업무일지를 조회할 때 [사용자,타이틀,날짜] 등으로 검색 혹은 필터링 할 수 있게 구현함

## 미완성 부분 및 향후 개선 계획

### 1. **인증 및 권한 관리**

- JWT 기반 인증 추가
- 역할 기반 접근제어:
  - Admin: 전체 기능 접근
  - TeamLead: Sprint, task 관리 기능
  - Member: 자신의 task, worklog만 접근

### 2. **배치 작업**

- 일일 통계 계산 및 카톡알림
- 주간 리포트 생성하여 메일전송
- 만료된 스프린트, 업무 자동 처리

### 3. **알림 기능**

- 이벤트 기반 알림 시스템 (WebSocket)
- 알림 대상:
  - 업무 상태 변경
  - 스프린트 시작/종료
  - 담당자 변경
  - 마감일 임박 알림

### 4. **파일 첨부 기능**

- 업무 일지에 파일 업로드/다운로드 API

### 5. **테스트 커버리지 확대**

- 현재 : 82개 단위 테스트 + 24개 E2E 테스트 (100% 통과)
- 성능 테스트 (부하 테스트)
- 보안 테스트 (SQL Injection, XSS 등)

## 테스트

### 단위 테스트

```bash
# 모든 단위 테스트 실행
pnpm run test

# 감시 모드 (파일 변경 시 자동 실행)
pnpm run test:watch

# 커버리지 리포트
pnpm run test:cov
```

테스트 결과: 82개 테스트 모두 통과 (100% 성공률)

### E2E 테스트

```bash
# E2E 테스트 실행
pnpm run test:e2e
```

E2E 테스트는 다음을 검증합니다:

- 전체 API 엔드포인트의 정상 작동
- 요청/응답 데이터 구조
- 입력 검증
- 오류 처리
- 통합 워크플로우
