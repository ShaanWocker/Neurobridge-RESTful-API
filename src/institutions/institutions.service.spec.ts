import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionsService } from './institutions.service';
import { Institution, InstitutionType, VerificationStatus } from './entities/institution.entity';
import { AuditService } from '@audit/audit.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('InstitutionsService', () => {
  let service: InstitutionsService;
  let repository: Repository<Institution>;
  let auditService: AuditService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
      clone: jest.fn().mockReturnThis(),
    })),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionsService,
        {
          provide: getRepositoryToken(Institution),
          useValue: mockRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<InstitutionsService>(InstitutionsService);
    repository = module.get<Repository<Institution>>(getRepositoryToken(Institution));
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new institution', async () => {
      const createDto = {
        name: 'Test School',
        type: InstitutionType.SCHOOL,
        email: 'test@school.com',
        phoneNumber: '1234567890',
        addressLine1: '123 Test St',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12345',
        country: 'Test Country',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createDto);
      mockRepository.save.mockResolvedValue({ id: '1', ...createDto });

      const result = await service.create(createDto, 'user-id');

      expect(result).toHaveProperty('id');
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      const createDto = {
        name: 'Test School',
        type: InstitutionType.SCHOOL,
        email: 'test@school.com',
        phoneNumber: '1234567890',
        addressLine1: '123 Test St',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12345',
        country: 'Test Country',
      };

      mockRepository.findOne.mockResolvedValue({ id: '1', email: createDto.email });

      await expect(service.create(createDto, 'user-id')).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return an institution', async () => {
      const institution = {
        id: '1',
        name: 'Test School',
        email: 'test@school.com',
      };

      mockRepository.findOne.mockResolvedValue(institution);

      const result = await service.findOne('1');

      expect(result).toEqual(institution);
    });

    it('should throw NotFoundException if institution not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});