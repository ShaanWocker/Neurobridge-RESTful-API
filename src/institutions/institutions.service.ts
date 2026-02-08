import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Institution, VerificationStatus, InstitutionStatus } from './entities/institution.entity';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { VerifyInstitutionDto } from './dto/verify-institution.dto';
import { SearchInstitutionDto } from './dto/search-institution.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { AuditService } from '@audit/audit.service';
import { AuditAction } from '@audit/entities/audit-log.entity';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private institutionsRepository: Repository<Institution>,
    private auditService: AuditService,
  ) {}

  async create(createInstitutionDto: CreateInstitutionDto, userId?: string): Promise<Institution> {
    // Check for duplicate email
    const existingInstitution = await this.institutionsRepository.findOne({
      where: { email: createInstitutionDto.email },
    });

    if (existingInstitution) {
      throw new ConflictException('Institution with this email already exists');
    }

    const institution = this.institutionsRepository.create({
      ...createInstitutionDto,
      verificationStatus: VerificationStatus.PENDING,
      status: InstitutionStatus.ACTIVE,
    });

    const savedInstitution = await this.institutionsRepository.save(institution);

    // Log creation
    await this.auditService.log({
      userId,
      action: AuditAction.INSTITUTION_CREATED,
      entityType: 'Institution',
      entityId: savedInstitution.id,
      metadata: {
        name: savedInstitution.name,
        type: savedInstitution.type,
      },
    });

    return savedInstitution;
  }

  async findAll(searchDto: SearchInstitutionDto): Promise<PaginatedResponseDto<Institution>> {
    const { page, limit, type, verificationStatus, city, province, specialization, supportNeed, minAge, maxAge, search, hasCapacity } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.institutionsRepository.createQueryBuilder('institution');

    // Basic filters
    if (type) {
      queryBuilder.andWhere('institution.type = :type', { type });
    }

    if (verificationStatus) {
      queryBuilder.andWhere('institution.verificationStatus = :verificationStatus', {
        verificationStatus,
      });
    }

    // Location filters
    if (city) {
      queryBuilder.andWhere('LOWER(institution.city) = LOWER(:city)', { city });
    }

    if (province) {
      queryBuilder.andWhere('LOWER(institution.province) = LOWER(:province)', { province });
    }

    // Specialization filter (JSON array contains)
    if (specialization) {
      queryBuilder.andWhere('institution.specializations @> :specialization', {
        specialization: JSON.stringify([specialization]),
      });
    }

    // Support need filter
    if (supportNeed) {
      queryBuilder.andWhere('institution.supportNeeds @> :supportNeed', {
        supportNeed: JSON.stringify([supportNeed]),
      });
    }

    // Age range filter
    if (minAge !== undefined) {
      queryBuilder.andWhere('institution.minAgeSupported <= :minAge', { minAge });
    }

    if (maxAge !== undefined) {
      queryBuilder.andWhere('institution.maxAgeSupported >= :maxAge', { maxAge });
    }

    // Capacity filter
    if (hasCapacity) {
      queryBuilder.andWhere('institution.currentCapacity < institution.maxCapacity');
    }

    // Search by name or description
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(institution.name) LIKE LOWER(:search) OR LOWER(institution.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Exclude deleted institutions
    queryBuilder.andWhere('institution.deletedAt IS NULL');

    // Pagination and ordering
    queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('institution.verificationStatus', 'DESC')
      .addOrderBy('institution.name', 'ASC');

    const [institutions, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: institutions,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Institution> {
    const institution = await this.institutionsRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['users', 'currentLearners'],
    });

    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    }

    return institution;
  }

  async findByEmail(email: string): Promise<Institution> {
    return this.institutionsRepository.findOne({
      where: { email, deletedAt: null },
    });
  }

  async update(
    id: string,
    updateInstitutionDto: UpdateInstitutionDto,
    userId?: string,
  ): Promise<Institution> {
    const institution = await this.findOne(id);

    // If email is being updated, check for duplicates
    if (updateInstitutionDto.email && updateInstitutionDto.email !== institution.email) {
      const existingInstitution = await this.findByEmail(updateInstitutionDto.email);
      if (existingInstitution) {
        throw new ConflictException('Institution with this email already exists');
      }
    }

    Object.assign(institution, updateInstitutionDto);

    const updatedInstitution = await this.institutionsRepository.save(institution);

    // Log update
    await this.auditService.log({
      userId,
      action: AuditAction.INSTITUTION_UPDATED,
      entityType: 'Institution',
      entityId: updatedInstitution.id,
      metadata: {
        name: updatedInstitution.name,
        changes: updateInstitutionDto,
      },
    });

    return updatedInstitution;
  }

  async verify(
    id: string,
    verifyDto: VerifyInstitutionDto,
    verifiedBy: string,
  ): Promise<Institution> {
    const institution = await this.findOne(id);

    institution.verificationStatus = verifyDto.status;
    institution.verifiedBy = verifiedBy;
    institution.verifiedAt = new Date();
    institution.verificationNotes = verifyDto.notes;

    const verifiedInstitution = await this.institutionsRepository.save(institution);

    // Log verification
    await this.auditService.log({
      userId: verifiedBy,
      action: AuditAction.INSTITUTION_VERIFIED,
      entityType: 'Institution',
      entityId: verifiedInstitution.id,
      metadata: {
        name: verifiedInstitution.name,
        status: verifyDto.status,
        notes: verifyDto.notes,
      },
    });

    return verifiedInstitution;
  }

  async updateStatus(
    id: string,
    status: InstitutionStatus,
    userId?: string,
  ): Promise<Institution> {
    const institution = await this.findOne(id);

    institution.status = status;

    const updatedInstitution = await this.institutionsRepository.save(institution);

    // Log status change
    await this.auditService.log({
      userId,
      action: AuditAction.INSTITUTION_UPDATED,
      entityType: 'Institution',
      entityId: updatedInstitution.id,
      metadata: {
        name: updatedInstitution.name,
        statusChange: status,
      },
    });

    return updatedInstitution;
  }

  async getStatistics(institutionId?: string): Promise<any> {
    const queryBuilder = this.institutionsRepository.createQueryBuilder('institution');

    if (institutionId) {
      queryBuilder.where('institution.id = :institutionId', { institutionId });
    }

    queryBuilder.andWhere('institution.deletedAt IS NULL');

    const totalInstitutions = await queryBuilder.getCount();

    const verifiedCount = await queryBuilder
      .clone()
      .andWhere('institution.verificationStatus = :status', {
        status: VerificationStatus.VERIFIED,
      })
      .getCount();

    const pendingCount = await queryBuilder
      .clone()
      .andWhere('institution.verificationStatus = :status', {
        status: VerificationStatus.PENDING,
      })
      .getCount();

    const schoolCount = await queryBuilder
      .clone()
      .andWhere('institution.type = :type', { type: 'school' })
      .getCount();

    const tutorCentreCount = await queryBuilder
      .clone()
      .andWhere('institution.type = :type', { type: 'tutor_centre' })
      .getCount();

    return {
      total: totalInstitutions,
      verified: verifiedCount,
      pending: pendingCount,
      schools: schoolCount,
      tutorCentres: tutorCentreCount,
    };
  }

  async remove(id: string, userId?: string): Promise<void> {
    const institution = await this.findOne(id);

    // Soft delete
    institution.deletedAt = new Date();
    await this.institutionsRepository.save(institution);

    // Log deletion
    await this.auditService.log({
      userId,
      action: AuditAction.INSTITUTION_DELETED,
      entityType: 'Institution',
      entityId: institution.id,
      metadata: {
        name: institution.name,
        type: institution.type,
      },
    });
  }

  async getAvailableSpecializations(): Promise<string[]> {
    const result = await this.institutionsRepository
      .createQueryBuilder('institution')
      .select('DISTINCT jsonb_array_elements_text(institution.specializations)', 'specialization')
      .where('institution.deletedAt IS NULL')
      .andWhere('institution.verificationStatus = :status', {
        status: VerificationStatus.VERIFIED,
      })
      .getRawMany();

    return result.map((r) => r.specialization).filter(Boolean).sort();
  }

  async getAvailableSupportNeeds(): Promise<string[]> {
    const result = await this.institutionsRepository
      .createQueryBuilder('institution')
      .select('DISTINCT jsonb_array_elements_text(institution.supportNeeds)', 'supportNeed')
      .where('institution.deletedAt IS NULL')
      .andWhere('institution.verificationStatus = :status', {
        status: VerificationStatus.VERIFIED,
      })
      .getRawMany();

    return result.map((r) => r.supportNeed).filter(Boolean).sort();
  }
}