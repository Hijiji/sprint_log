import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

describe('Sprint Log API (e2e)', () => {
  let app: INestApplication;
  let sprintId: string;
  let taskId: string;
  let worklogId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('App Controller', () => {
    it('GET / - 기본 응답', () => {
      return request(app.getHttpServer()).get('/api/v1/').expect(200);
    });

    it('GET /health - 헬스 체크', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('ok');
        });
    });
  });

  describe('Sprint Controller', () => {
    it('POST /sprints - 스프린트 생성', () => {
      const dto = {
        title: 'Sprint 1',
        description: 'Test sprint',
        startDate: '2026-01-06',
        endDate: '2026-01-20',
        status: 'PLANNED',
      };
      return request(app.getHttpServer())
        .post('/api/v1/sprints')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.sprint.sprintId).toBeDefined();
          sprintId = res.body.data.sprint.sprintId;
        });
    });

    it('GET /sprints - 스프린트 목록 조회', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sprints')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.sprints).toBeDefined();
          expect(Array.isArray(res.body.data.sprints)).toBe(true);
        });
    });

    it('GET /sprints/:id - 스프린트 상세 조회', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/sprints/${sprintId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.sprintId).toBe(sprintId);
        });
    });

    it('PATCH /sprints/:id - 스프린트 수정', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/sprints/${sprintId}`)
        .send({ title: 'Updated Sprint' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.title).toBe('Updated Sprint');
        });
    });

    it('POST /sprints/:id/start - 스프린트 시작', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/sprints/${sprintId}/start`)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('ACTIVE');
        });
    });

    it('POST /sprints/:id/complete - 스프린트 완료', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/sprints/${sprintId}/complete`)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('COMPLETED');
        });
    });
  });

  describe('Task Controller', () => {
    it('POST /task - 업무 생성', () => {
      const dto = {
        title: 'Task 1',
        description: 'Test task',
        priority: 'HIGH',
        expectedWorkTime: 8,
      };
      return request(app.getHttpServer())
        .post('/api/v1/task')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.taskId).toBeDefined();
          taskId = res.body.data.taskId;
        });
    });

    it('GET /task - 업무 목록 조회', () => {
      return request(app.getHttpServer())
        .get('/api/v1/task')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.tasks).toBeDefined();
          expect(Array.isArray(res.body.data.tasks)).toBe(true);
        });
    });

    it('GET /task/:id - 업무 상세 조회', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/task/${taskId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.taskId).toBe(taskId);
        });
    });

    it('PATCH /task/:id - 업무 수정', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/task/${taskId}`)
        .send({ title: 'Updated Task' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.title).toBe('Updated Task');
        });
    });

    it('POST /task/:id/assign-sprint - 스프린트 할당', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/task/${taskId}/assign-sprint`)
        .send({ sprintId })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('DELETE /task/:id/assign-sprint - 스프린트 할당 제거', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/task/${taskId}/assign-sprint`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Work-Log Controller', () => {
    it('POST /work-log - 작업 로그 생성', () => {
      const dto = {
        title: 'Work Log 1',
        contents: 'Test work',
        workTime: 4,
        workDate: '2026-01-04',
        taskId,
        memberId: 'member-001',
      };
      return request(app.getHttpServer())
        .post('/api/v1/work-log')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.workLogId).toBeDefined();
          worklogId = res.body.data.workLogId;
        });
    });

    it('GET /work-log - 작업 로그 목록 조회', () => {
      return request(app.getHttpServer())
        .get('/api/v1/work-log')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.workLogs).toBeDefined();
        });
    });

    it('GET /work-log/:id - 작업 로그 상세 조회', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/work-log/${worklogId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.workLogId).toBe(worklogId);
        });
    });

    it('PATCH /work-log/:id - 작업 로그 수정', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/work-log/${worklogId}`)
        .send({ title: 'Updated Work Log' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.title).toBe('Updated Work Log');
        });
    });

    it('DELETE /work-log/:id - 작업 로그 삭제', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/work-log/${worklogId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Statistics Controller', () => {
    it('GET /statistics/sprints/:id - 스프린트 통계', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/statistics/sprints/${sprintId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('GET /statistics/users/:id/summary - 사용자 요약', () => {
      return request(app.getHttpServer())
        .get('/api/v1/statistics/users/member-001/summary')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('GET /statistics/tasks/:id/time-tracking - 업무 시간 추적', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/statistics/tasks/${taskId}/time-tracking`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Task Controller - 삭제 테스트', () => {
    it('DELETE /task/:id - 업무 삭제', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/task/${taskId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
    it('전체 워크플로우: 스프린트 -> 업무 -> 할당 -> 로그', async () => {
      const sprintRes = await request(app.getHttpServer())
        .post('/api/v1/sprints')
        .send({
          title: 'Integration Sprint',
          startDate: '2026-02-01',
          endDate: '2026-02-15',
          status: 'PLANNED',
        });
      expect(sprintRes.status).toBe(201);

      const taskRes = await request(app.getHttpServer())
        .post('/api/v1/task')
        .send({
          title: 'Integration Task',
          priority: 'HIGH',
          expectedWorkTime: 5,
        });
      expect(taskRes.status).toBe(201);

      const assignRes = await request(app.getHttpServer())
        .post(`/api/v1/task/${taskRes.body.data.taskId}/assign-sprint`)
        .send({ sprintId: sprintRes.body.data.sprint.sprintId });
      expect(assignRes.status).toBe(201);

      const worklogRes = await request(app.getHttpServer())
        .post('/api/v1/work-log')
        .send({
          title: 'Integration Work',
          contents: 'Test',
          workTime: 3,
          workDate: '2026-01-04',
          taskId: taskRes.body.data.taskId,
          memberId: 'member-001',
        });
      expect(worklogRes.status).toBe(201);

      const statsRes = await request(app.getHttpServer()).get(
        `/api/v1/statistics/sprints/${sprintRes.body.data.sprint.sprintId}`,
      );
      expect(statsRes.status).toBe(200);
    });
  });
});
