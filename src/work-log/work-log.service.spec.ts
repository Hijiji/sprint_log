import { Test, TestingModule } from '@nestjs/testing';
import { WorkLogService } from './work-log.service';
import { DataSource } from 'typeorm';
import { WorkLog } from 'src/database/entities/worklog.entity';
import { Task } from 'src/database/entities/task.entity';
import { Member } from 'src/database/entities/member.entity';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';
import { ConfigService } from '@nestjs/config';

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
      addOrderBy: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
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
      getRepository: jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        if (entity === Task) return mockTaskRepository;
        if (entity === Member) return mockMemberRepository;
        return mockWorkLogRepository;
      }),
    } as any;

    const mockConfigService = {
      get: jest.fn((key) => {
        if (key === 'pagination.defaultLimit') return 10;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkLogService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
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
    it('필터링 없이 모든 WorkLog 조회', async () => {
      // Arrange
      const mockWorklogs = [
        {
          workLogId: 'worklog-1',
          title: 'WorkLog 1',
          contents: 'Contents 1',
          workDate: new Date('2026-01-04'),
          workTime: 4,
          createdAt: new Date('2026-01-04'),
          task: { taskId: 'task-1', title: 'Task 1' },
          member: { memberId: 'member-1', name: 'John Doe' },
        },
        {
          workLogId: 'worklog-2',
          title: 'WorkLog 2',
          contents: 'Contents 2',
          workDate: new Date('2026-01-05'),
          workTime: 6,
          createdAt: new Date('2026-01-05'),
          task: { taskId: 'task-2', title: 'Task 2' },
          member: { memberId: 'member-2', name: 'Jane Smith' },
        },
      ];

      const findAllWorklogDto = {
        limit: 10,
        offset: 0,
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue(mockWorklogs);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      const result = await service.findAll(findAllWorklogDto);

      // Assert
      expect(result.workLogs.length).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.offset).toBe(0);
      expect(mockWorkLogRepository.createQueryBuilder).toHaveBeenCalledWith(
        'worklog',
      );
      // 실제 반환값 구조 검증
      expect(result.workLogs[0].task.taskTitle).toBe('Task 1');
      expect(result.workLogs[0].member.memberName).toBe('John Doe');
    });

    it('memberName 필터링 적용', async () => {
      // Arrange
      const findAllWorklogDto = {
        limit: 10,
        offset: 0,
        memberName: 'John',
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      await service.findAll(findAllWorklogDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'member.name LIKE :memberName',
        { memberName: '%John%' },
      );
    });

    it('taskTitle 필터링 적용', async () => {
      // Arrange
      const findAllWorklogDto = {
        limit: 10,
        offset: 0,
        taskTitle: 'Development',
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      await service.findAll(findAllWorklogDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.title Like :taskTitle',
        { taskTitle: '%Development%' },
      );
    });

    it('workDate 필터링 적용', async () => {
      // Arrange
      const workDate = new Date('2026-01-05');
      const findAllWorklogDto = {
        limit: 10,
        offset: 0,
        workDate: workDate,
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      await service.findAll(findAllWorklogDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'worklog.workDate = :workDate',
        { workDate: workDate },
      );
    });

    it('여러 필터 동시 적용', async () => {
      // Arrange
      const workDate = new Date('2026-01-05');
      const findAllWorklogDto = {
        limit: 10,
        offset: 0,
        memberName: 'John',
        taskTitle: 'Development',
        workDate: workDate,
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      await service.findAll(findAllWorklogDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'member.name LIKE :memberName',
        { memberName: '%John%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.title Like :taskTitle',
        { taskTitle: '%Development%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'worklog.workDate = :workDate',
        { workDate: workDate },
      );
    });

    it('offset 페이징 적용', async () => {
      // Arrange
      const findAllWorklogDto = {
        limit: 10,
        offset: 20,
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      await service.findAll(findAllWorklogDto);

      // Assert
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('정렬 순서 확인 (createdAt DESC, workLogId DESC)', async () => {
      // Arrange
      const findAllWorklogDto = {
        limit: 10,
        offset: 0,
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      await service.findAll(findAllWorklogDto);

      // Assert
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'worklog.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'worklog.workLogId',
        'DESC',
      );
    });

    it('기본 limit 값 사용', async () => {
      // Arrange
      const findAllWorklogDto = {
        offset: 0,
        // limit 없음
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      await service.findAll(findAllWorklogDto);

      // Assert
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10); // defaultLimit
    });

    it('Task와 Member 관계 로드', async () => {
      // Arrange
      const findAllWorklogDto = {
        limit: 10,
        offset: 0,
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      await service.findAll(findAllWorklogDto);

      // Assert
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'worklog.task',
        'task',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'worklog.member',
        'member',
      );
    });

    it('삭제되지 않은 WorkLog만 조회 (isDeleted: false)', async () => {
      // Arrange
      const findAllWorklogDto = {
        limit: 10,
        offset: 0,
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      await service.findAll(findAllWorklogDto);

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'task.isDeleted = :isDeleted',
        { isDeleted: false },
      );
    });

    it('메타데이터 반환 검증', async () => {
      // Arrange
      const mockWorklogs = [mockWorkLog];
      const findAllWorklogDto = {
        limit: 10,
        offset: 0,
      } as any;

      mockQueryBuilder.getMany.mockResolvedValue(mockWorklogs);
      mockWorkLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      // Act
      const result = await service.findAll(findAllWorklogDto);

      // Assert
      expect(result.meta).toBeDefined();
      expect(result.meta.limit).toBe(10);
      expect(result.meta.offset).toBe(0);
      expect(result.workLogs.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('특정 WorkLog 조회 성공', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(mockWorkLog);

      // Act
      const result = await service.findOne(workLogIdDto);

      // Assert
      expect(result).toEqual(mockWorkLog);
      expect(mockWorkLogRepository.findOne).toHaveBeenCalledWith({
        select: {
          workLogId: true,
          title: true,
          contents: true,
          createdAt: true,
          workTime: true,
          workDate: true,
          isDeleted: true,
          deletedAt: true,
          member: { memberId: true, name: true },
        },
        where: { workLogId: 'worklog-1', isDeleted: false },
        relations: ['member'],
      });
    });

    it('존재하지 않는 WorkLog 조회 시 에러 발생', async () => {
      // Arrange
      const workLogIdDto = { id: 'non-existent-worklog' };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.findOne(workLogIdDto);
        expect(true).toBe(false); // 에러가 발생해야 함
      } catch (error) {
        // 에러가 발생하면 통과
        expect(error).toBeDefined();
      }
    });

    it('WorkLog와 Task, Member 정보 함께 조회', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };

      const workLogWithRelations = {
        ...mockWorkLog,
        task: {
          taskId: 'task-1',
          title: 'Related Task',
        },
        member: {
          memberId: 'member-1',
          name: 'John Doe',
        },
      };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(workLogWithRelations);

      // Act
      const result = await service.findOne(workLogIdDto);

      // Assert
      expect(result.member).toBeDefined();
      expect(result.member.memberId).toBe('member-1');
      expect(result.member.name).toBe('John Doe');
      expect(mockWorkLogRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('WorkLog 제목만 업데이트', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };
      const updateWorkLogDto: UpdateWorkLogDto = {
        title: 'Updated Title',
      } as UpdateWorkLogDto;

      const updatedWorkLog = {
        ...mockWorkLog,
        title: 'Updated Title',
      };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(mockWorkLog);
      mockWorkLogRepository.save.mockResolvedValue(updatedWorkLog);

      // Act
      const result = await service.update(workLogIdDto, updateWorkLogDto);

      // Assert
      expect(result.title).toBe('Updated Title');
      expect(mockWorkLogRepository.findOne).toHaveBeenCalledWith({
        where: { workLogId: 'worklog-1', isDeleted: false },
      });
      expect(mockWorkLogRepository.save).toHaveBeenCalled();
    });

    it('WorkLog 내용 업데이트', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };
      const updateWorkLogDto: UpdateWorkLogDto = {
        contents: 'Updated contents',
      } as UpdateWorkLogDto;

      const updatedWorkLog = {
        ...mockWorkLog,
        contents: 'Updated contents',
      };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(mockWorkLog);
      mockWorkLogRepository.save.mockResolvedValue(updatedWorkLog);

      // Act
      const result = await service.update(workLogIdDto, updateWorkLogDto);

      // Assert
      expect(result.contents).toBe('Updated contents');
      expect(mockWorkLogRepository.save).toHaveBeenCalled();
    });

    it('WorkLog 작업시간 업데이트', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };
      const updateWorkLogDto: UpdateWorkLogDto = {
        workTime: 8,
      } as UpdateWorkLogDto;

      const updatedWorkLog = {
        ...mockWorkLog,
        workTime: 8,
      };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(mockWorkLog);
      mockWorkLogRepository.save.mockResolvedValue(updatedWorkLog);

      // Act
      const result = await service.update(workLogIdDto, updateWorkLogDto);

      // Assert
      expect(result.workTime).toBe(8);
      expect(mockWorkLogRepository.save).toHaveBeenCalled();
    });

    it('WorkLog 작업일 업데이트', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };
      const newDate = new Date('2026-01-05');
      const updateWorkLogDto: UpdateWorkLogDto = {
        workDate: newDate,
      } as UpdateWorkLogDto;

      const updatedWorkLog = {
        ...mockWorkLog,
        workDate: newDate,
      };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(mockWorkLog);
      mockWorkLogRepository.save.mockResolvedValue(updatedWorkLog);

      // Act
      const result = await service.update(workLogIdDto, updateWorkLogDto);

      // Assert
      expect(result.workDate).toEqual(newDate);
      expect(mockWorkLogRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 WorkLog 업데이트 시 에러 발생', async () => {
      // Arrange
      const workLogIdDto = { id: 'non-existent-worklog' };
      const updateWorkLogDto: UpdateWorkLogDto = {
        title: 'Updated Title',
      } as UpdateWorkLogDto;

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.update(workLogIdDto, updateWorkLogDto);
        expect(true).toBe(false); // 에러가 발생해야 함
      } catch (error) {
        expect(error.message).toBe('존재하지 않는 업무일지입니다.');
      }
    });

    it('여러 필드를 동시에 업데이트', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };
      const updateWorkLogDto: UpdateWorkLogDto = {
        title: 'New Title',
        contents: 'New contents',
        workTime: 6,
        workDate: new Date('2026-01-06'),
      } as UpdateWorkLogDto;

      const updatedWorkLog = {
        ...mockWorkLog,
        title: 'New Title',
        contents: 'New contents',
        workTime: 6,
        workDate: new Date('2026-01-06'),
      };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(mockWorkLog);
      mockWorkLogRepository.save.mockResolvedValue(updatedWorkLog);

      // Act
      const result = await service.update(workLogIdDto, updateWorkLogDto);

      // Assert
      expect(result.title).toBe('New Title');
      expect(result.contents).toBe('New contents');
      expect(result.workTime).toBe(6);
      expect(mockWorkLogRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('WorkLog 소프트 삭제 성공', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };
      const now = new Date();

      const deletedWorkLog = {
        ...mockWorkLog,
        isDeleted: true,
        deletedAt: now,
      };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(mockWorkLog);
      mockWorkLogRepository.save.mockResolvedValue(deletedWorkLog);

      // Act
      const result = await service.remove(workLogIdDto);

      // Assert
      expect(result.isDeleted).toBe(true);
      expect(result.deletedAt).toBeDefined();
      expect(mockWorkLogRepository.findOne).toHaveBeenCalledWith({
        where: { workLogId: 'worklog-1', isDeleted: false },
      });
      expect(mockWorkLogRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 WorkLog 삭제 시 에러 발생', async () => {
      // Arrange
      const workLogIdDto = { id: 'non-existent-worklog' };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.remove(workLogIdDto);
        expect(true).toBe(false); // 에러가 발생해야 함
      } catch (error) {
        expect(error.message).toBe('존재하지 않는 업무일지입니다.');
      }
    });

    it('이미 삭제된 WorkLog 다시 삭제 시도 시 에러 발생', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };
      const deletedWorkLog = {
        ...mockWorkLog,
        isDeleted: true,
        deletedAt: new Date('2026-01-03'),
      };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      // 이미 삭제된 항목은 findOne에서 반환되지 않음 (where 조건에서 isDeleted: false)
      mockWorkLogRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.remove(workLogIdDto);
        expect(true).toBe(false); // 에러가 발생해야 함
      } catch (error) {
        expect(error.message).toBe('존재하지 않는 업무일지입니다.');
      }
    });

    it('deletedAt이 현재 시간으로 설정', async () => {
      // Arrange
      const workLogIdDto = { id: 'worklog-1' };
      const beforeDelete = new Date();

      const deletedWorkLog = {
        ...mockWorkLog,
        isDeleted: true,
        deletedAt: new Date(),
      };

      mockQueryRunner.manager.getRepository = jest.fn((entity: any) => {
        if (entity === WorkLog) return mockWorkLogRepository;
        return mockWorkLogRepository;
      });

      mockWorkLogRepository.findOne.mockResolvedValue(mockWorkLog);
      mockWorkLogRepository.save.mockResolvedValue(deletedWorkLog);

      // Act
      const result = await service.remove(workLogIdDto);

      // Assert
      expect(result.deletedAt.getTime()).toBeGreaterThanOrEqual(
        beforeDelete.getTime(),
      );
      expect(result.deletedAt.getTime()).toBeLessThanOrEqual(
        new Date().getTime(),
      );
    });
  });
});
