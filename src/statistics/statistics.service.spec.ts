import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { DataSource } from 'typeorm';
import { Task } from 'src/database/entities/task.entity';
import { WorkLog } from 'src/database/entities/worklog.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTaskRepository: any;
  let mockWorkLogRepository: any;

  beforeEach(async () => {
    // TaskRepository Mock
    mockTaskRepository = {
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    // WorkLogRepository Mock
    mockWorkLogRepository = {
      createQueryBuilder: jest.fn(),
    };

    // DataSource Mock
    mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === Task) return mockTaskRepository;
        if (entity === WorkLog) return mockWorkLogRepository;
        return null;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findSprintStatistics', () => {
    it('스프린트별 업무 상태 통계 조회', async () => {
      // Arrange
      const sprintIdDto = { id: 'sprint-001' };
      const mockTasks = [
        { taskId: 'task-1', status: TaskStatusEnum.PLANNED },
        { taskId: 'task-2', status: TaskStatusEnum.ACTIVE },
        { taskId: 'task-3', status: TaskStatusEnum.ACTIVE },
        { taskId: 'task-4', status: TaskStatusEnum.COMPLETED },
        { taskId: 'task-5', status: TaskStatusEnum.HOLD },
      ];

      mockTaskRepository.findAndCount.mockResolvedValue([mockTasks, 5]);

      // Act
      const result = await service.findSprintStatistics(sprintIdDto);

      // Assert
      expect(result.sprintId).toBe('sprint-001');
      expect(result.totalTaskCount).toBe(5);
      expect(result.statusCounts[TaskStatusEnum.PLANNED]).toBe(1);
      expect(result.statusCounts[TaskStatusEnum.ACTIVE]).toBe(2);
      expect(result.statusCounts[TaskStatusEnum.COMPLETED]).toBe(1);
      expect(result.statusCounts[TaskStatusEnum.HOLD]).toBe(1);

      // 백분율 확인
      expect(result.statusPercentage[TaskStatusEnum.PLANNED]).toBe(20);
      expect(result.statusPercentage[TaskStatusEnum.ACTIVE]).toBe(40);
      expect(result.statusPercentage[TaskStatusEnum.COMPLETED]).toBe(20);
      expect(result.statusPercentage[TaskStatusEnum.HOLD]).toBe(20);
    });

    it('Task가 없는 경우', async () => {
      // Arrange
      const sprintIdDto = { id: 'empty-sprint' };
      mockTaskRepository.findAndCount.mockResolvedValue([[], 0]);

      // Act
      const result = await service.findSprintStatistics(sprintIdDto);

      // Assert
      expect(result.totalTaskCount).toBe(0);
      expect(result.statusCounts[TaskStatusEnum.PLANNED]).toBe(0);
      expect(result.statusCounts[TaskStatusEnum.ACTIVE]).toBe(0);
      expect(result.statusCounts[TaskStatusEnum.COMPLETED]).toBe(0);
      expect(result.statusCounts[TaskStatusEnum.HOLD]).toBe(0);

      // 백분율은 모두 0
      expect(result.statusPercentage[TaskStatusEnum.PLANNED]).toBe(0);
      expect(result.statusPercentage[TaskStatusEnum.ACTIVE]).toBe(0);
    });

    it('한 가지 status만 있는 경우', async () => {
      // Arrange
      const sprintIdDto = { id: 'sprint-002' };
      const mockTasks = [
        { taskId: 'task-1', status: TaskStatusEnum.ACTIVE },
        { taskId: 'task-2', status: TaskStatusEnum.ACTIVE },
        { taskId: 'task-3', status: TaskStatusEnum.ACTIVE },
      ];

      mockTaskRepository.findAndCount.mockResolvedValue([mockTasks, 3]);

      // Act
      const result = await service.findSprintStatistics(sprintIdDto);

      // Assert
      expect(result.totalTaskCount).toBe(3);
      expect(result.statusCounts[TaskStatusEnum.ACTIVE]).toBe(3);
      expect(result.statusPercentage[TaskStatusEnum.ACTIVE]).toBe(100);
    });
  });

  describe('findUserSummary', () => {
    let mockTaskQueryBuilder: any;
    let mockWorkLogQueryBuilder: any;

    beforeEach(() => {
      mockTaskQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockWorkLogQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      mockTaskRepository.createQueryBuilder.mockReturnValue(
        mockTaskQueryBuilder,
      );
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockWorkLogQueryBuilder,
      );
    });

    it('사용자의 업무 요약 정보를 조회', async () => {
      const memberIdDto = { id: 'member-001' };
      const mockTasks = [
        { taskId: 'task-1', status: TaskStatusEnum.PLANNED, member: { memberId: 'member-001' } },
        { taskId: 'task-2', status: TaskStatusEnum.ACTIVE, member: { memberId: 'member-001' } },
        { taskId: 'task-3', status: TaskStatusEnum.COMPLETED, member: { memberId: 'member-001' } },
      ];

      mockTaskQueryBuilder.getMany.mockResolvedValue(mockTasks);
      mockWorkLogQueryBuilder.getRawOne.mockResolvedValue({
        totalWorkTime: 480, // 8시간 = 480분
      });

      const result = await service.findUserSummary(memberIdDto);

      expect(result.memberId).toBe('member-001');
      expect(result.totalTaskCount).toBe(3);
      expect(result.statusCounts[TaskStatusEnum.PLANNED]).toBe(1);
      expect(result.statusCounts[TaskStatusEnum.ACTIVE]).toBe(1);
      expect(result.statusCounts[TaskStatusEnum.COMPLETED]).toBe(1);
      expect(result.totalWorkTime).toBe(480);
      expect(result.periodFilter).toBe('ALL');
    });

    it('년월 필터로 사용자 업무 조회', async () => {
      const memberIdDto = {
        id: 'member-001',
        yearAndMonth: '2026-01',
      };
      const mockTasks = [
        { taskId: 'task-1', status: TaskStatusEnum.ACTIVE, member: { memberId: 'member-001' } },
      ];

      mockTaskQueryBuilder.getMany.mockResolvedValue(mockTasks);
      mockWorkLogQueryBuilder.getRawOne.mockResolvedValue({
        totalWorkTime: 240,
      });

      const result = await service.findUserSummary(memberIdDto);

      expect(result.totalTaskCount).toBe(1);
      expect(result.totalWorkTime).toBe(240);
      expect(result.periodFilter).toBe('2026-01');
      // strftime 조건 호출 검증
      expect(mockTaskQueryBuilder.andWhere).toHaveBeenCalledWith(
        "strftime('%Y-%m', task.expectedStartDate) = :yearAndMonth",
        { yearAndMonth: '2026-01' },
      );
    });

    it('스프린트 필터로 사용자 업무 조회', async () => {
      const memberIdDto = {
        id: 'member-001',
        sprintTitle: 'Sprint 1',
      };
      const mockTasks = [
        {
          taskId: 'task-1',
          status: TaskStatusEnum.ACTIVE,
          sprint: { title: 'Sprint 1' },
        },
      ];

      mockTaskQueryBuilder.getMany.mockResolvedValue(mockTasks);
      mockWorkLogQueryBuilder.getRawOne.mockResolvedValue({
        totalWorkTime: 300,
      });

      const result = await service.findUserSummary(memberIdDto);

      expect(result.totalTaskCount).toBe(1);
      expect(result.totalWorkTime).toBe(300);
      // LIKE 조건 호출 검증
      expect(mockTaskQueryBuilder.andWhere).toHaveBeenCalledWith(
        'sprint.title LIKE :sprintTitle',
        { sprintTitle: '%Sprint 1%' },
      );
    });

    it('workTime이 없을 때 0을 반환', async () => {
      const memberIdDto = { id: 'member-001' };
      mockTaskQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.findUserSummary(memberIdDto);

      expect(result.totalWorkTime).toBe(0);
      expect(result.totalTaskCount).toBe(0);
    });
  });

  describe('findTaskTimeTracking', () => {
    let mockTaskQueryBuilder: any;
    let mockWorkLogQueryBuilder: any;

    beforeEach(() => {
      mockTaskQueryBuilder = {
        findOne: jest.fn(),
      };

      mockWorkLogQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      mockTaskRepository.findOne = mockTaskQueryBuilder.findOne;
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockWorkLogQueryBuilder,
      );
    });

    it('업무별 시간 추적 분석 - 예상 vs 실제 비교 (초과)', async () => {
      const taskIdDto = { id: 'task-001' };
      const mockTask = {
        taskId: 'task-001',
        title: 'API 개발',
        status: TaskStatusEnum.ACTIVE,
        snapshotExpectedWorkTime: 480, // 8시간 (스냅샷)
        sprint: { title: 'Sprint 1' },
        member: { name: 'John Doe' },
      };

      mockTaskQueryBuilder.findOne.mockResolvedValue(mockTask);
      mockWorkLogQueryBuilder.getRawOne.mockResolvedValue({
        totalWorkTime: 550, // 9시간 10분 (초과)
      });

      const result = await service.findTaskTimeTracking(taskIdDto);

      expect(result.taskId).toBe('task-001');
      expect(result.taskTitle).toBe('API 개발');
      expect(result.status).toBe(TaskStatusEnum.ACTIVE);
      expect(result.sprintTitle).toBe('Sprint 1');
      expect(result.assignedMember).toBe('John Doe');
      expect(result.snapshotExpectedTime).toBe(480);
      expect(result.totalWorkTime).toBe(550);
      expect(result.timeDifference).toBe(70); // 초과
      expect(result.workTimeStatus).toBe('OVER');
    });

    it('시간이 정확한 경우 (EXACT)', async () => {
      const taskIdDto = { id: 'task-002' };
      const mockTask = {
        taskId: 'task-002',
        title: '테스트 작성',
        status: TaskStatusEnum.COMPLETED,
        snapshotExpectedWorkTime: 300,
        sprint: { title: 'Sprint 1' },
        member: { name: 'Jane Doe' },
      };

      mockTaskQueryBuilder.findOne.mockResolvedValue(mockTask);
      mockWorkLogQueryBuilder.getRawOne.mockResolvedValue({
        totalWorkTime: 300,
      });

      const result = await service.findTaskTimeTracking(taskIdDto);

      expect(result.snapshotExpectedTime).toBe(300);
      expect(result.totalWorkTime).toBe(300);
      expect(result.timeDifference).toBe(0);
      expect(result.workTimeStatus).toBe('EXACT');
    });

    it('시간이 미달인 경우 (UNDER)', async () => {
      const taskIdDto = { id: 'task-003' };
      const mockTask = {
        taskId: 'task-003',
        title: '문서 작성',
        status: TaskStatusEnum.COMPLETED,
        snapshotExpectedWorkTime: 240,
        sprint: { title: 'Sprint 1' },
        member: { name: 'Bob Smith' },
      };

      mockTaskQueryBuilder.findOne.mockResolvedValue(mockTask);
      mockWorkLogQueryBuilder.getRawOne.mockResolvedValue({
        totalWorkTime: 180,
      });

      const result = await service.findTaskTimeTracking(taskIdDto);

      expect(result.snapshotExpectedTime).toBe(240);
      expect(result.totalWorkTime).toBe(180);
      expect(result.timeDifference).toBe(-60); // 미달
      expect(result.workTimeStatus).toBe('UNDER');
    });

    it('업무가 존재하지 않는 경우', async () => {
      const taskIdDto = { id: 'non-existent-task' };
      mockTaskQueryBuilder.findOne.mockResolvedValue(null);

      expect(async () => {
        await service.findTaskTimeTracking(taskIdDto);
      }).rejects.toThrow('존재하지 않는 업무입니다.');
    });

    it('WorkLog가 없는 경우', async () => {
      const taskIdDto = { id: 'task-004' };
      const mockTask = {
        taskId: 'task-004',
        title: '계획 단계',
        status: TaskStatusEnum.PLANNED,
        snapshotExpectedWorkTime: 120,
        sprint: { title: 'Sprint 1' },
        member: null,
      };

      mockTaskQueryBuilder.findOne.mockResolvedValue(mockTask);
      mockWorkLogQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.findTaskTimeTracking(taskIdDto);

      expect(result.snapshotExpectedTime).toBe(120);
      expect(result.totalWorkTime).toBe(0);
      expect(result.timeDifference).toBe(-120);
      expect(result.workTimeStatus).toBe('UNDER');
    });

    it('스냅샷이 0인 경우 (스냅샷 저장 안됨)', async () => {
      const taskIdDto = { id: 'task-005' };
      const mockTask = {
        taskId: 'task-005',
        title: '미시작 업무',
        status: TaskStatusEnum.PLANNED,
        snapshotExpectedWorkTime: null, // 스냅샷 미저장
        sprint: null,
        member: null,
      };

      mockTaskQueryBuilder.findOne.mockResolvedValue(mockTask);
      mockWorkLogQueryBuilder.getRawOne.mockResolvedValue({
        totalWorkTime: 100,
      });

      const result = await service.findTaskTimeTracking(taskIdDto);

      expect(result.snapshotExpectedTime).toBe(null);
      expect(result.totalWorkTime).toBe(100);
    });
  });
});
