import { Test, TestingModule } from '@nestjs/testing';
import { SprintService } from './sprint.service';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Sprint } from 'src/database/entities/sprint.entity';
import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
import { BadRequestException } from '@nestjs/common';

describe('SprintService', () => {
  let service: SprintService;
  let dataSource: DataSource;
  let mockQueryRunner: any;
  let mockManager: EntityManager;
  let mockSprintRepository: Repository<Sprint>;

  beforeEach(async () => {
    // Mock Repository
    mockSprintRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    // Mock EntityManager
    mockManager = {
      getRepository: jest.fn().mockReturnValue(mockSprintRepository),
    } as any;

    // Mock QueryRunner
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    };

    // Mock DataSource
    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SprintService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SprintService>(SprintService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      title: 'Sprint001',
      description: '첫번째 스프린트',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: SprintStatusEnum.ACTIVE,
    };

    const savedSprint = {
      sprintId: 'uuid-123',
      ...createDto,
      createdAt: new Date(),
      isDeleted: false,
    };

    it('스프린트 성공적 생성', async () => {
      (mockSprintRepository.save as jest.Mock).mockResolvedValue(savedSprint);

      const result = await service.create(createDto);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockManager.getRepository).toHaveBeenCalledWith(Sprint);
      expect(mockSprintRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sprint001',
          description: '첫번째 스프린트',
          status: SprintStatusEnum.ACTIVE,
        }),
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(savedSprint);
    });

    it('종료일이 시작일보다 빠르면 BadRequestException', async () => {
      const invalidDto = {
        ...createDto,
        startDate: '2026-02-02',
        endDate: '2026-01-05',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        '종료일은 시작일보다 늦어야 합니다.',
      );

      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('저장 중 오류 발생 시 롤백하고 예외발생', async () => {
      const dbError = new Error('DB connection failed');
      (mockSprintRepository.save as jest.Mock).mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        'DB connection failed',
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('기본값 적용', async () => {
      const minimalDto = {
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        status: undefined as any,
      };

      (mockSprintRepository.save as jest.Mock).mockResolvedValue(savedSprint);

      await service.create(minimalDto);

      expect(mockSprintRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '',
          description: '',
          status: SprintStatusEnum.PLANNED,
          startDate: null,
          endDate: null,
          isDeleted: false,
        }),
      );
    });
  });
});
