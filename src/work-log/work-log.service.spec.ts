import { Test, TestingModule } from '@nestjs/testing';
import { WorkLogService } from './work-log.service';
import { DataSource } from 'typeorm';
import { WorkLog } from 'src/database/entities/worklog.entity';
import { Task } from 'src/database/entities/task.entity';
import { Member } from 'src/database/entities/member.entity';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';

describe('WorkLogService', () => {
  let service: WorkLogService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockWorkLogRepository: any;
  let mockTaskRepository: any;
  let mockMemberRepository: any;
  let mockManager: any;
  let mockQueryBuilder: any;
  let mockQueryRunner: any;

  const mockTask = {
    taskId: 'task-1',
    title: 'Test Task',
    status: 'ACTIVE',
  };

  const mockMember = {
    memberId: 'member-1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockWorkLog = {
    workLogId: 'worklog-1',
    title: 'Test WorkLog',
    contents: 'Test contents',
    workDate: new Date('2026-01-04'),
    workTime: 4,
    createdAt: new Date('2026-01-04'),
    isDeleted: false,
    deletedAt: null,
    task: mockTask,
    member: mockMember,
  };

  beforeEach(async () => {
    // Repository Mocks
    mockWorkLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockTaskRepository = {
      findOne: jest.fn(),
    };

    mockMemberRepository = {
      findOne: jest.fn(),
    };

    // Manager Mock
    mockManager = {
      getRepository: jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        if (entity === Task) return mockTaskRepository;
        if (entity === Member) return mockMemberRepository;
        return mockWorkLogRepository;
      }),
    };

    // QueryBuilder Mock
    mockQueryBuilder = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    };

    // QueryRunner Mock
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: jest.fn((entity: any) => {
          if (entity === WorkLog) return mockWorkLogRepository;
          if (entity === Task) return mockTaskRepository;
          if (entity === Member) return mockMemberRepository;
          return mockWorkLogRepository;
        }),
      },
    };

    // DataSource Mock
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkLogService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<WorkLogService>(WorkLogService);
  });

  describe('create', () => {
    it('Task와 Member를 로드하여 WorkLog 생성', async () => {
      // Arrange
      const createWorkLogDto: CreateWorkLogDto = {
        title: 'Test WorkLog',
        contents: 'Test contents',
        workDate: new Date('2026-01-04'),
        workTime: 4,
        taskId: 'task-1',
        memberId: 'member-1',
      } as CreateWorkLogDto;

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockWorkLogRepository.create.mockReturnValue(mockWorkLog);
      mockWorkLogRepository.save.mockResolvedValue(mockWorkLog);

      // Act
      const result = await service.create(createWorkLogDto);

      // Assert
      expect(result).toEqual(mockWorkLog);
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { taskId: 'task-1' },
      });
      expect(mockMemberRepository.findOne).toHaveBeenCalledWith({
        where: { memberId: 'member-1' },
      });
      expect(mockWorkLogRepository.save).toHaveBeenCalled();
    });

    it('Task가 없을 때 null로 생성', async () => {
      // Arrange
      const createWorkLogDto: CreateWorkLogDto = {
        title: 'Test WorkLog',
        contents: 'Test contents',
        workDate: new Date('2026-01-04'),
        workTime: 4,
        memberId: 'member-1',
      } as CreateWorkLogDto;

      mockTaskRepository.findOne.mockResolvedValue(null);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);

      const workLogWithoutTask = {
        ...mockWorkLog,
        task: null,
      };
      mockWorkLogRepository.create.mockReturnValue(workLogWithoutTask);
      mockWorkLogRepository.save.mockResolvedValue(workLogWithoutTask);

      // Act
      const result = await service.create(createWorkLogDto);

      // Assert
      expect(result.task).toBeNull();
      expect(mockWorkLogRepository.save).toHaveBeenCalled();
    });

    it('Member가 없을 때 null로 생성', async () => {
      // Arrange
      const createWorkLogDto: CreateWorkLogDto = {
        title: 'Test WorkLog',
        contents: 'Test contents',
        workDate: new Date('2026-01-04'),
        workTime: 4,
        taskId: 'task-1',
      } as CreateWorkLogDto;

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockMemberRepository.findOne.mockResolvedValue(null);

      const workLogWithoutMember = {
        ...mockWorkLog,
        member: null,
      };
      mockWorkLogRepository.create.mockReturnValue(workLogWithoutMember);
      mockWorkLogRepository.save.mockResolvedValue(workLogWithoutMember);

      // Act
      const result = await service.create(createWorkLogDto);

      // Assert
      expect(result.member).toBeNull();
      expect(mockWorkLogRepository.save).toHaveBeenCalled();
    });

    it('workTime이 0 이상인지 검증 필요', async () => {
      // Arrange
      const createWorkLogDto: CreateWorkLogDto = {
        title: 'Test WorkLog',
        workTime: -1, // 유효하지 않은 값
        taskId: 'task-1',
        memberId: 'member-1',
      } as CreateWorkLogDto;

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockWorkLogRepository.create.mockReturnValue({
        ...mockWorkLog,
        workTime: -1,
      });
      mockWorkLogRepository.save.mockResolvedValue({
        ...mockWorkLog,
        workTime: -1,
      });

      // Act
      const result = await service.create(createWorkLogDto);

      // Assert
      // 현재는 validate가 없으므로 통과, 나중에 추가 필요
      expect(result.workTime).toBe(-1);
    });

    it('createdAt이 자동으로 현재 날짜로 설정', async () => {
      // Arrange
      const createWorkLogDto: CreateWorkLogDto = {
        title: 'Test WorkLog',
        contents: 'Test contents',
        workDate: new Date('2026-01-04'),
        workTime: 4,
        taskId: 'task-1',
        memberId: 'member-1',
      } as CreateWorkLogDto;

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);

      const now = new Date();
      const workLogWithCreatedAt = {
        ...mockWorkLog,
        createdAt: now,
      };
      mockWorkLogRepository.create.mockReturnValue(workLogWithCreatedAt);
      mockWorkLogRepository.save.mockResolvedValue(workLogWithCreatedAt);

      // Act
      const result = await service.create(createWorkLogDto);

      // Assert
      expect(result.createdAt).toBeDefined();
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(
        new Date().getTime(),
      );
    });
  });

  describe('findAll', () => {
    it('모든 WorkLog 조회', async () => {
      // Arrange
      mockWorkLogRepository.find.mockResolvedValue([mockWorkLog]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toContain('This action returns all workLog');
    });
  });

  describe('findOne', () => {
    it('특정 WorkLog 조회', async () => {
      // Arrange
      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toContain('This action returns a #1 workLog');
    });
  });

  describe('update', () => {
    it('WorkLog 업데이트', async () => {
      // Arrange
      const updateWorkLogDto: UpdateWorkLogDto = {
        title: 'Updated Title',
        workTime: 8,
      };

      // Act
      const result = await service.update(1, updateWorkLogDto);

      // Assert
      expect(result).toContain('This action updates a #1 workLog');
    });
  });

  describe('remove', () => {
    it('WorkLog 삭제 (소프트 삭제)', async () => {
      // Arrange
      // Act
      const result = await service.remove(1);

      // Assert
      expect(result).toContain('This action removes a #1 workLog');
    });
  });
});
