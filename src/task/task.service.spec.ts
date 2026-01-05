import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { DataSource } from 'typeorm';
import { Task } from 'src/database/entities/task.entity';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { FindAllTaskDto } from './dto/find-all-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Sprint } from 'src/database/entities/sprint.entity';
import { Member } from 'src/database/entities/member.entity';
import { WorkLog } from 'src/database/entities/worklog.entity';
import { TaskIdDto } from './dto/task-id.dto';

describe('TaskService', () => {
  let service: TaskService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryBuilder: any;
  let mockTaskRepository: any;
  let mockWorklogRepository: any;

  beforeEach(async () => {
    // QueryBuilder Mock
    mockQueryBuilder = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    // Repository Mock
    mockTaskRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
    };

    mockWorklogRepository = {
      find: jest.fn(),
    };

    // DataSource Mock
    mockDataSource = {
      getRepository: jest.fn((entity: any) => {
        if (entity === Task) return mockTaskRepository;
        if (entity === WorkLog) return mockWorklogRepository;
        return mockTaskRepository;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  describe('findAll', () => {
    it('필터링 없이 모든 업무 조회', async () => {
      // Arrange
      const mockTasks = [
        {
          taskId: 'task-1',
          title: 'Task 1',
          status: TaskStatusEnum.PLANNED,
          sprint: { sprintId: 'sprint-1', title: 'Sprint 1' },
          members: { id: 'member-1', name: 'John' },
        },
        {
          taskId: 'task-2',
          title: 'Task 2',
          status: TaskStatusEnum.ACTIVE,
          sprint: { sprintId: 'sprint-1', title: 'Sprint 1' },
          members: { id: 'member-2', name: 'Jane' },
        },
      ];

      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue(mockTasks);

      // Act
      const result = await service.findAll(findAllTaskDto);

      // Assert
      expect(result.tasks).toEqual(mockTasks);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.limit).toBe(2);
      expect(mockTaskRepository.createQueryBuilder).toHaveBeenCalledWith(
        'task',
      );
    });

    it('status 필터링 적용', async () => {
      // Arrange
      const mockTasks = [
        {
          taskId: 'task-1',
          title: 'Task 1',
          status: TaskStatusEnum.ACTIVE,
        },
      ];

      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
        status: TaskStatusEnum.ACTIVE,
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue(mockTasks);

      // Act
      await service.findAll(findAllTaskDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: TaskStatusEnum.ACTIVE },
      );
    });

    it('sprintTitle 필터링 적용', async () => {
      // Arrange
      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
        sprintTitle: 'Sprint',
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await service.findAll(findAllTaskDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'sprint.title LIKE :sprintTitle',
        { sprintTitle: '%Sprint%' },
      );
    });

    it('memberName 필터링 적용', async () => {
      // Arrange
      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
        memberName: 'John',
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await service.findAll(findAllTaskDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'member.name LIKE :memberName',
        { memberName: '%John%' },
      );
    });

    it('taskTitle 필터링 적용', async () => {
      // Arrange
      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
        taskTitle: 'Development',
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await service.findAll(findAllTaskDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.title LIKE :taskTitle',
        { taskTitle: '%Development%' },
      );
    });

    it('다음 페이지 존재 여부 판단 (limit + 1개 조회)', async () => {
      // Arrange
      const mockTasks = Array.from({ length: 11 }, (_, i) => ({
        taskId: `task-${i}`,
        title: `Task ${i}`,
        status: TaskStatusEnum.PLANNED,
      }));

      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue(mockTasks);

      // Act
      const result = await service.findAll(findAllTaskDto);

      // Assert
      expect(result.tasks.length).toBe(10); // 10개만 반환
      expect(result.meta.hasNextPage).toBe(true); // 11번째 있으므로 true
      expect(result.meta.nextCursor).toBe('task-9'); // 10번째 taskId
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(11); // limit + 1
    });

    it('cursor 기반 페이징', async () => {
      // Arrange
      const mockTasks = [
        {
          taskId: 'task-11',
          title: 'Task 11',
        },
        {
          taskId: 'task-12',
          title: 'Task 12',
        },
      ];

      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
        cursor: 'task-10', // 이전 페이지의 마지막
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue(mockTasks);

      // Act
      await service.findAll(findAllTaskDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.taskId > :cursor',
        { cursor: 'task-10' },
      );
    });

    it('정렬 순서 확인 (createdAt DESC, taskId DESC)', async () => {
      // Arrange
      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await service.findAll(findAllTaskDto);

      // Assert
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'task.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'task.taskId',
        'DESC',
      );
    });

    it('soft delete 필터링 (isDeleted = false)', async () => {
      // Arrange
      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await service.findAll(findAllTaskDto);

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'task.isDeleted = :isDeleted',
        { isDeleted: false },
      );
    });

    it('여러 필터링 조건 동시 적용', async () => {
      // Arrange
      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
        status: TaskStatusEnum.ACTIVE,
        sprintTitle: 'Sprint',
        memberName: 'John',
        taskTitle: 'Dev',
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      await service.findAll(findAllTaskDto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
      expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'task.status = :status',
        { status: TaskStatusEnum.ACTIVE },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'sprint.title LIKE :sprintTitle',
        { sprintTitle: '%Sprint%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        3,
        'member.name LIKE :memberName',
        { memberName: '%John%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
        4,
        'task.title LIKE :taskTitle',
        { taskTitle: '%Dev%' },
      );
    });

    it('마지막 페이지일 때 nextCursor는 undefined', async () => {
      // Arrange
      const mockTasks = [
        { taskId: 'task-1', title: 'Task 1' },
        { taskId: 'task-2', title: 'Task 2' },
        { taskId: 'task-3', title: 'Task 3' },
      ];

      const findAllTaskDto: FindAllTaskDto = {
        limit: 10,
      } as FindAllTaskDto;

      mockQueryBuilder.getMany.mockResolvedValue(mockTasks);

      // Act
      const result = await service.findAll(findAllTaskDto);

      // Assert
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.nextCursor).toBeUndefined();
    });
  });

  describe('create', () => {
    let mockTaskRepository: any;
    let mockSprintRepository: any;
    let mockMemberRepository: any;
    let mockManager: any;
    let mockQueryRunner: any;

    beforeEach(() => {
      mockTaskRepository = {
        create: jest.fn().mockReturnValue({ taskId: 'task-1' }),
        save: jest.fn(),
      };

      mockSprintRepository = {
        findOne: jest.fn(),
      };

      mockMemberRepository = {
        findOne: jest.fn(),
      };

      mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          getRepository: jest.fn((entity: any) => {
            if (entity === Task) return mockTaskRepository;
            if (entity === Sprint) return mockSprintRepository;
            if (entity === Member) return mockMemberRepository;
            return mockTaskRepository;
          }),
        },
      };

      mockDataSource.createQueryRunner = jest
        .fn()
        .mockReturnValue(mockQueryRunner);
    });

    it('기본 필드만으로 업무 생성', async () => {
      // Arrange
      const CreateTaskDto = {
        title: 'New Task',
        description: 'Task Description',
      };

      const createdTask = {
        taskId: 'task-1',
        title: 'New Task',
        description: 'Task Description',
        status: TaskStatusEnum.PLANNED,
        isBackLog: true,
        sprint: null,
        members: null,
      };

      mockTaskRepository.create.mockReturnValue(createdTask);
      mockTaskRepository.save.mockResolvedValue(createdTask);

      // Act
      const result = await service.create(CreateTaskDto as any);

      // Assert
      expect(result.title).toBe('New Task');
      expect(result.status).toBe(TaskStatusEnum.PLANNED);
      expect(result.isBackLog).toBe(true);
      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalled();
    });

    it('스프린트와 멤버를 함께 생성', async () => {
      // Arrange
      const sprintId = 'sprint-1';
      const memberId = 'member-1';
      const mockSprint = { sprintId, title: 'Sprint 1' };
      const mockMember = { memberId, name: 'John' };

      const createTaskDto = {
        title: 'Task with Sprint',
        sprintId,
        memberId,
      };

      const createdTask = {
        taskId: 'task-1',
        title: 'Task with Sprint',
        sprint: mockSprint,
        member: mockMember,
        isBackLog: false,
      };

      mockSprintRepository.findOne.mockResolvedValue(mockSprint);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockTaskRepository.create.mockReturnValue(createdTask);
      mockTaskRepository.save.mockResolvedValue(createdTask);

      // Act
      const result = await service.create(createTaskDto as any);

      // Assert
      expect(result.sprint).toBe(mockSprint);
      expect(result.member).toBe(mockMember);
      expect(result.isBackLog).toBe(false);
      expect(mockSprintRepository.findOne).toHaveBeenCalledWith({
        where: { sprintId },
      });
    });

    it('상태가 ACTIVE일 때 startDate 자동 설정', async () => {
      // Arrange
      const createTaskDto = {
        title: 'Active Task',
        status: TaskStatusEnum.ACTIVE,
      };

      const createdTask = {
        taskId: 'task-1',
        title: 'Active Task',
        status: TaskStatusEnum.ACTIVE,
        startDate: expect.any(Date),
        endDate: null,
      };

      mockTaskRepository.create.mockReturnValue(createdTask);
      mockTaskRepository.save.mockResolvedValue(createdTask);

      // Act
      const result = await service.create(createTaskDto as any);

      // Assert
      expect(result.startDate).toBeDefined();
      expect(result.status).toBe(TaskStatusEnum.ACTIVE);
    });

    it('상태가 COMPLETED일 때 endDate 자동 설정', async () => {
      // Arrange
      const createTaskDto = {
        title: 'Completed Task',
        status: TaskStatusEnum.COMPLETED,
      };

      const createdTask = {
        taskId: 'task-1',
        title: 'Completed Task',
        status: TaskStatusEnum.COMPLETED,
        startDate: null,
        endDate: expect.any(Date),
      };

      mockTaskRepository.create.mockReturnValue(createdTask);
      mockTaskRepository.save.mockResolvedValue(createdTask);

      // Act
      const result = await service.create(createTaskDto as any);

      // Assert
      expect(result.endDate).toBeDefined();
      expect(result.status).toBe(TaskStatusEnum.COMPLETED);
    });

    it('예상 날짜 검증 - 시작일이 종료일보다 늦을 경우 에러', async () => {
      // Arrange
      const createTaskDto = {
        title: 'Task',
        expectedStartDate: new Date('2026-01-10'),
        expectedEndDate: new Date('2026-01-05'),
      };

      // Act & Assert
      await expect(service.create(createTaskDto as any)).rejects.toThrow(
        '종료일은 시작일보다 늦어야 합니다.',
      );
    });

    it('expectedWorkTime 기본값 0으로 설정', async () => {
      // Arrange
      const createTaskDto = {
        title: 'Task without worktime',
      };

      const createdTask = {
        taskId: 'task-1',
        title: 'Task without worktime',
        expectedWorkTime: 0,
      };

      mockTaskRepository.create.mockReturnValue(createdTask);
      mockTaskRepository.save.mockResolvedValue(createdTask);

      // Act
      const result = await service.create(createTaskDto as any);

      // Assert
      expect(result.expectedWorkTime).toBe(0);
    });
  });

  describe('update', () => {
    let mockTaskRepository: any;
    let mockSprintRepository: any;
    let mockMemberRepository: any;
    let mockManager: any;
    let mockQueryRunner: any;

    beforeEach(() => {
      mockTaskRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
      };

      mockSprintRepository = {
        findOne: jest.fn(),
      };

      mockMemberRepository = {
        findOne: jest.fn(),
      };

      mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          getRepository: jest.fn((entity: any) => {
            if (entity === Task) return mockTaskRepository;
            if (entity === Sprint) return mockSprintRepository;
            if (entity === Member) return mockMemberRepository;
          }),
        },
      };

      mockManager = {
        getRepository: jest.fn((entity: any) => {
          if (entity === Task) return mockTaskRepository;
          if (entity === Sprint) return mockSprintRepository;
          if (entity === Member) return mockMemberRepository;
        }),
      };

      // DataSource의 getRepository 설정
      mockDataSource.getRepository = jest.fn((entity: any) => {
        if (entity === Task) return mockTaskRepository;
        if (entity === Sprint) return mockSprintRepository;
        if (entity === Member) return mockMemberRepository;
      });

      // createQueryRunner 설정
      mockDataSource.createQueryRunner = jest
        .fn()
        .mockReturnValue(mockQueryRunner);
    });

    it('업무 기본 정보 수정', async () => {
      // Arrange
      const taskId = 'task-1';
      const existingTask = {
        taskId,
        title: 'Old Title',
        description: 'Old Description',
        status: TaskStatusEnum.PLANNED,
        expectedWorkTime: 5,
        priority: null,
        updatedAt: null,
      };

      const updateTaskDto: UpdateTaskDto = {
        title: 'New Title',
        description: 'New Description',
        expectedWorkTime: 10,
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockTaskRepository.save.mockResolvedValue({
        ...existingTask,
        ...updateTaskDto,
        updatedAt: expect.any(Date),
      });

      // Act
      const taskIdDto: TaskIdDto = { id: taskId };
      const result = await service.update(taskIdDto, updateTaskDto);

      // Assert
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { taskId, isDeleted: false },
      });
      expect(existingTask.title).toBe('New Title');
      expect(existingTask.description).toBe('New Description');
      expect(existingTask.expectedWorkTime).toBe(10);
      expect(mockTaskRepository.save).toHaveBeenCalled();
    });

    it('업무 상태 변경 시 startDate 자동 설정', async () => {
      // Arrange
      const taskId = 'task-1';
      const existingTask = {
        taskId,
        title: 'Task',
        status: TaskStatusEnum.PLANNED,
        startDate: null,
        updatedAt: null,
      };

      const updateTaskDto: UpdateTaskDto = {
        status: TaskStatusEnum.ACTIVE,
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockTaskRepository.save.mockImplementation((task) => {
        return Promise.resolve(task);
      });

      // Act
      const taskIdDto: TaskIdDto = { id: taskId };
      const result = await service.update(taskIdDto, updateTaskDto);

      // Assert
      expect(result.status).toBe(TaskStatusEnum.ACTIVE);
      expect(result.startDate).toEqual(expect.any(Date));
    });

    it('업무 상태를 완료로 변경 시 endDate 자동 설정', async () => {
      // Arrange
      const taskId = 'task-1';
      const existingTask = {
        taskId,
        title: 'Task',
        status: TaskStatusEnum.ACTIVE,
        endDate: null,
        updatedAt: null,
      };

      const updateTaskDto: UpdateTaskDto = {
        status: TaskStatusEnum.COMPLETED,
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockTaskRepository.save.mockImplementation((task) => {
        return Promise.resolve(task);
      });

      // Act
      const taskIdDto: TaskIdDto = { id: taskId };
      const result = await service.update(taskIdDto, updateTaskDto);

      // Assert
      expect(result.status).toBe(TaskStatusEnum.COMPLETED);
      expect(result.endDate).toEqual(expect.any(Date));
    });

    it('Sprint 관계 수정', async () => {
      // Arrange
      const taskId = 'task-1';
      const existingTask = {
        taskId,
        title: 'Task',
        sprint: null,
        isBackLog: true,
        updatedAt: null,
      };

      const sprintId = 'sprint-1';
      const mockSprint = { sprintId, title: 'Sprint 1' };

      const updateTaskDto: UpdateTaskDto = {
        sprintId,
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockSprintRepository.findOne.mockResolvedValue(mockSprint);
      mockTaskRepository.save.mockResolvedValue(existingTask);

      // Act
      const taskIdDto: TaskIdDto = { id: taskId };
      await service.update(taskIdDto, updateTaskDto);

      // Assert
      expect(mockSprintRepository.findOne).toHaveBeenCalledWith({
        where: { sprintId },
      });
      expect(existingTask.sprint).toBe(mockSprint);
      expect(existingTask.isBackLog).toBe(false);
    });

    it('Member 관계 수정', async () => {
      // Arrange
      const taskId = 'task-1';
      const existingTask = {
        taskId,
        title: 'Task',
        member: null,
        updatedAt: null,
      };

      const memberId = 'member-1';
      const mockMember = { id: memberId, name: 'John' };

      const updateTaskDto: UpdateTaskDto = {
        memberId,
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockTaskRepository.save.mockResolvedValue(existingTask);

      // Act
      const taskIdDto: TaskIdDto = { id: taskId };
      await service.update(taskIdDto, updateTaskDto);

      // Assert
      expect(mockMemberRepository.findOne).toHaveBeenCalledWith({
        where: { memberId },
      });
      expect(existingTask.member).toBe(mockMember);
    });

    it('존재하지 않는 업무 수정 시 에러 발생', async () => {
      // Arrange
      const taskId = 'non-existent';
      const updateTaskDto: UpdateTaskDto = {
        title: 'New Title',
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      const taskIdDto: TaskIdDto = { id: taskId };
      await expect(service.update(taskIdDto, updateTaskDto)).rejects.toThrow(
        '존재하지 않는 업무입니다.',
      );
    });

    it('존재하지 않는 스프린트로 수정 시 에러 발생', async () => {
      // Arrange
      const taskId = 'task-1';
      const existingTask = {
        taskId,
        title: 'Task',
        sprint: null,
      };

      const updateTaskDto: UpdateTaskDto = {
        sprintId: 'non-existent-sprint',
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockSprintRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      const taskIdDto: TaskIdDto = { id: taskId };
      await expect(service.update(taskIdDto, updateTaskDto)).rejects.toThrow(
        '존재하지 않는 스프린트입니다.',
      );
    });

    it('예상 날짜 검증 - 시작일이 종료일보다 늦을 경우 에러', async () => {
      // Arrange
      const taskId = 'task-1';
      const existingTask = {
        taskId,
        title: 'Task',
      };

      const updateTaskDto: UpdateTaskDto = {
        expectedStartDate: new Date('2026-02-01'),
        expectedEndDate: new Date('2026-01-01'),
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(existingTask);

      // Act & Assert
      const taskIdDto: TaskIdDto = { id: taskId };
      await expect(service.update(taskIdDto, updateTaskDto)).rejects.toThrow(
        '종료일은 시작일보다 늦어야 합니다.',
      );
    });

    it('updatedAt 필드 자동 설정', async () => {
      // Arrange
      const taskId = 'task-1';
      const existingTask = {
        taskId,
        title: 'Old Title',
        updatedAt: null,
      };

      const updateTaskDto: UpdateTaskDto = {
        title: 'New Title',
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockTaskRepository.save.mockResolvedValue(existingTask);

      // Act
      const taskIdDto: TaskIdDto = { id: taskId };
      await service.update(taskIdDto, updateTaskDto);

      // Assert
      expect(existingTask.updatedAt).toEqual(expect.any(Date));
    });

    it('Sprint 제거 시 isBackLog 자동으로 true로 설정', async () => {
      // Arrange
      const taskId = 'task-1';
      const mockSprint = { sprintId: 'sprint-1', title: 'Sprint 1' };
      const existingTask = {
        taskId,
        title: 'Task',
        sprint: mockSprint,
        isBackLog: false,
        updatedAt: null,
      };

      const updateTaskDto: UpdateTaskDto = {
        sprintId: null,
      } as UpdateTaskDto;

      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockTaskRepository.save.mockResolvedValue(existingTask);

      // Act
      const taskIdDto: TaskIdDto = { id: taskId };
      await service.update(taskIdDto, updateTaskDto);

      // Assert
      expect(existingTask.sprint).toBeNull();
      expect(existingTask.isBackLog).toBe(true);
    });
  });

  describe('findOne', () => {
    it('업무 상세 조회 - 기본 정보와 worklog 함께 조회', async () => {
      // Arrange
      const taskId = 'task-1';
      const taskIdDto: TaskIdDto = { id: taskId };
      const mockTask = {
        taskId,
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatusEnum.ACTIVE,
        member: { memberId: 'member-1', name: 'John' },
      };
      const mockWorklogs = [
        { workLogId: 'log-1', title: 'Worklog 1', createdAt: new Date() },
        { workLogId: 'log-2', title: 'Worklog 2', createdAt: new Date() },
      ];

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockWorklogRepository.find.mockResolvedValue(mockWorklogs);

      // Act
      const result = await service.findOne(taskIdDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.taskId).toBe(taskId);
      expect(result.title).toBe('Test Task');
      expect(result.member).toBeDefined();
      expect(result.member.name).toBe('John');
      expect(result.worklogs).toHaveLength(2);
      expect(result.worklogs[0].title).toBe('Worklog 1');
    });

    it('존재하지 않는 업무 조회 시 에러 발생', async () => {
      // Arrange
      const taskIdDto: TaskIdDto = { id: 'non-existent' };
      mockTaskRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(taskIdDto)).rejects.toThrow(
        '존재하지 않는 업무입니다.',
      );
    });

    it('worklog가 없을 때 빈 배열 반환', async () => {
      // Arrange
      const taskId = 'task-1';
      const taskIdDto: TaskIdDto = { id: taskId };
      const mockTask = {
        taskId,
        title: 'Task without logs',
        members: null,
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockWorklogRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findOne(taskIdDto);

      // Assert
      expect(result.worklogs).toHaveLength(0);
      expect(Array.isArray(result.worklogs)).toBe(true);
    });
  });
});
