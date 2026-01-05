import { Test, TestingModule } from '@nestjs/testing';
import { SprintService } from './sprint.service';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Sprint } from 'src/database/entities/sprint.entity';
import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { BadRequestException } from '@nestjs/common';

describe('SprintService', () => {
  let service: SprintService;
  let dataSource: DataSource;
  let configService: ConfigService;
  let mockQueryRunner: any;
  let mockManager: EntityManager;
  let mockSprintRepository: Repository<Sprint>;

  beforeEach(async () => {
    // Mock Repository
    mockSprintRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
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
      getRepository: jest.fn().mockReturnValue(mockSprintRepository),
    };

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn().mockReturnValue(10),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SprintService,
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

    service = module.get<SprintService>(SprintService);
    dataSource = module.get<DataSource>(DataSource);
    configService = module.get<ConfigService>(ConfigService);
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
      members: [],
    };

    const savedSprint = {
      sprintId: 'uuid-123',
      ...createDto,
      createdAt: new Date(),
      isDeleted: false,
    };

    it('스프린트 성공적 생성', async () => {
      const createdSprint = {
        title: 'Sprint001',
        description: '첫번째 스프린트',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        status: SprintStatusEnum.ACTIVE,
      };

      (mockSprintRepository.create as jest.Mock).mockReturnValue(createdSprint);
      (mockSprintRepository.save as jest.Mock).mockResolvedValue(savedSprint);

      const result = await service.create(createDto);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockManager.getRepository).toHaveBeenCalledWith(Sprint);
      expect(mockSprintRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sprint001',
          description: '첫번째 스프린트',
          status: SprintStatusEnum.ACTIVE,
        }),
      );
      expect(mockSprintRepository.save).toHaveBeenCalledWith(createdSprint);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual({ sprint: savedSprint, members: [] });
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
        members: [],
      };

      const createdSprint = {
        title: '',
        description: '',
        startDate: null,
        endDate: null,
        status: SprintStatusEnum.PLANNED,
      };

      (mockSprintRepository.create as jest.Mock).mockReturnValue(createdSprint);
      (mockSprintRepository.save as jest.Mock).mockResolvedValue(savedSprint);

      await service.create(minimalDto);

      expect(mockSprintRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '',
          description: '',
          status: SprintStatusEnum.PLANNED,
          startDate: null,
          endDate: null,
        }),
      );
    });
  });

  describe('findAll', () => {
    const mockSprints = [
      {
        sprintId: 'uuid-1',
        title: 'Sprint 1',
        description: 'Description 1',
        startDate: '2026-01-01',
        endDate: '2026-01-15',
        status: SprintStatusEnum.ACTIVE,
        createdAt: new Date('2026-01-01'),
        isDeleted: false,
      },
      {
        sprintId: 'uuid-2',
        title: 'Sprint 2',
        description: 'Description 2',
        startDate: '2026-01-16',
        endDate: '2026-01-31',
        status: SprintStatusEnum.PLANNED,
        createdAt: new Date('2026-01-02'),
        isDeleted: false,
      },
    ];

    it('스프린트 목록 조회 - 페이지네이션', async () => {
      const findAllSprintDto = { offset: 0, limit: 10 };
      (mockSprintRepository.findAndCount as jest.Mock).mockResolvedValue([
        mockSprints,
        2,
      ]);

      const result = await service.findAll(findAllSprintDto);

      expect(dataSource.getRepository).toHaveBeenCalledWith(Sprint);
      expect(mockSprintRepository.findAndCount).toHaveBeenCalledWith({
        select: {
          sprintId: true,
          title: true,
          startDate: true,
          endDate: true,
          status: true,
        },
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });

      expect(result.sprints).toEqual(mockSprints);
      expect(result.meta).toEqual(PaginationMetaDto.create(2, 0, 10));
    });

    it('offset과 limit이 없으면 기본값 적용', async () => {
      const findAllSprintDto = {};
      (mockSprintRepository.findAndCount as jest.Mock).mockResolvedValue([
        mockSprints,
        2,
      ]);

      const result = await service.findAll(findAllSprintDto);

      expect(mockSprintRepository.findAndCount).toHaveBeenCalledWith({
        select: {
          sprintId: true,
          title: true,
          startDate: true,
          endDate: true,
          status: true,
        },
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });

      expect(result.meta.offset).toBe(0);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('커스텀 offset과 limit으로 조회', async () => {
      const findAllSprintDto = { offset: 20, limit: 5 };
      (mockSprintRepository.findAndCount as jest.Mock).mockResolvedValue([
        [],
        25,
      ]);

      const result = await service.findAll(findAllSprintDto);

      expect(mockSprintRepository.findAndCount).toHaveBeenCalledWith({
        select: {
          sprintId: true,
          title: true,
          startDate: true,
          endDate: true,
          status: true,
        },
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
        skip: 20,
        take: 5,
      });

      expect(result.sprints).toEqual([]);
      expect(result.meta).toEqual(PaginationMetaDto.create(25, 20, 5));
    });
  });

  describe('findOne', () => {
    const mockSprint = {
      sprintId: 'uuid-1',
      title: 'Sprint 1',
      description: 'Description 1',
      startDate: '2026-01-01',
      endDate: '2026-01-15',
      status: SprintStatusEnum.ACTIVE,
      createdAt: new Date('2026-01-01'),
      isDeleted: false,
      deletedAt: null,
    };

    it('스프린트 단건 조회 성공', async () => {
      const sprintIdDto = { id: 'uuid-1' };
      (mockSprintRepository.findOne as jest.Mock).mockResolvedValue(mockSprint);

      const result = await service.findOne(sprintIdDto);

      expect(dataSource.getRepository).toHaveBeenCalledWith(Sprint);
      expect(mockSprintRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sprintId: 'uuid-1', isDeleted: false },
          relations: ['tasks'],
        }),
      );
      expect(result).toEqual(mockSprint);
    });

    it('존재하지 않는 스프린트면 에러', async () => {
      const sprintIdDto = { id: 'invalid-id' };
      (mockSprintRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(sprintIdDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findOne(sprintIdDto)).rejects.toThrow(
        '존재하지 않는 스프린트입니다.',
      );
    });
  });
});
