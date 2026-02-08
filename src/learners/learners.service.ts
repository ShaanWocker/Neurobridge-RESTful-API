import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between } from 'typeorm';
import { Learner, LearnerStatus } from './entities/learner.entity';
import { CaseNote } from './entities/case-note.entity';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';
import { CreateCaseNoteDto } from './dto/create-case-note.dto';
import { UpdateCaseNoteDto } from './dto/update-case-note.dto';
import { SearchLearnerDto } from './dto/search-learner.dto';
import { AddGoalDto } from './dto/add-goal.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { AuditService } from '@audit/audit.service';
import { AuditAction } from '@audit/entities/audit-log.entity';
import { UserRole } from '@users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class LearnersService {
  constructor(
    @InjectRepository(Learner)
    private learnersRepository: Repository<Learner>,
    @InjectRepository(CaseNote)
    private caseNotesRepository: Repository<CaseNote>,
    private auditService: AuditService,
  ) {}

  private generateCaseNumber(): string {
    const prefix = 'NB';
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${year}-${random}`;
  }

  private checkAccess(learner: Learner, userId: string, institutionId: string): void {
    // Check if user's institution has access to this learner
    const hasAccess =
      learner.currentInstitutionId === institutionId ||
      learner.authorizedInstitutions.includes(institutionId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this learner record');
    }
  }

  async create(
    createLearnerDto: CreateLearnerDto,
    userId: string,
    institutionId: string,
  ): Promise<Learner> {
    // Verify institution access
    if (createLearnerDto.currentInstitutionId !== institutionId) {
      throw new ForbiddenException('You can only create learners for your institution');
    }

    const caseNumber = this.generateCaseNumber();

    const learner = this.learnersRepository.create({
      ...createLearnerDto,
      caseNumber,
      status: LearnerStatus.ACTIVE,
      createdBy: userId,
      lastModifiedBy: userId,
      authorizedInstitutions: [institutionId],
      authorizedUsers: [userId],
    });

    const savedLearner = await this.learnersRepository.save(learner);

    // Log creation
    await this.auditService.log({
      userId,
      action: AuditAction.LEARNER_CREATED,
      entityType: 'Learner',
      entityId: savedLearner.id,
      metadata: {
        caseNumber: savedLearner.caseNumber,
        institutionId,
      },
    });

    return savedLearner;
  }

  async findAll(
    searchDto: SearchLearnerDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<PaginatedResponseDto<Learner>> {
    const { page, limit, institutionId: filterInstitutionId, status, caseNumber, search, supportNeed, grade, minAge, maxAge } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.learnersRepository.createQueryBuilder('learner');

    // Super admin can see all, others only their institution's learners
    if (userRole !== UserRole.SUPER_ADMIN) {
      queryBuilder.andWhere('learner.currentInstitutionId = :institutionId', { institutionId });
    } else if (filterInstitutionId) {
      queryBuilder.andWhere('learner.currentInstitutionId = :filterInstitutionId', {
        filterInstitutionId,
      });
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('learner.status = :status', { status });
    }

    // Case number search
    if (caseNumber) {
      queryBuilder.andWhere('learner.caseNumber ILIKE :caseNumber', {
        caseNumber: `%${caseNumber}%`,
      });
    }

    // Name search
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(learner.firstName) LIKE LOWER(:search) OR LOWER(learner.lastName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Support need filter
    if (supportNeed) {
      queryBuilder.andWhere('learner.supportNeeds @> :supportNeed', {
        supportNeed: JSON.stringify([supportNeed]),
      });
    }

    // Grade filter
    if (grade) {
      queryBuilder.andWhere('learner.currentGrade = :grade', { grade });
    }

    // Age filter (calculated)
    if (minAge !== undefined || maxAge !== undefined) {
      const today = new Date();
      if (maxAge !== undefined) {
        const minBirthDate = new Date(
          today.getFullYear() - maxAge - 1,
          today.getMonth(),
          today.getDate(),
        );
        queryBuilder.andWhere('learner.dateOfBirth >= :minBirthDate', { minBirthDate });
      }
      if (minAge !== undefined) {
        const maxBirthDate = new Date(
          today.getFullYear() - minAge,
          today.getMonth(),
          today.getDate(),
        );
        queryBuilder.andWhere('learner.dateOfBirth <= :maxBirthDate', { maxBirthDate });
      }
    }

    // Exclude deleted
    queryBuilder.andWhere('learner.deletedAt IS NULL');

    // Pagination
    queryBuilder
      .leftJoinAndSelect('learner.currentInstitution', 'institution')
      .skip(skip)
      .take(limit)
      .orderBy('learner.createdAt', 'DESC');

    const [learners, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: learners,
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

  async findOne(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Learner> {
    const learner = await this.learnersRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['currentInstitution', 'caseNotes', 'caseNotes.author'],
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID ${id} not found`);
    }

    // Access control
    if (userRole !== UserRole.SUPER_ADMIN) {
      this.checkAccess(learner, userId, institutionId);
    }

    // Log access
    await this.auditService.log({
      userId,
      action: AuditAction.LEARNER_VIEWED,
      entityType: 'Learner',
      entityId: learner.id,
      metadata: {
        caseNumber: learner.caseNumber,
      },
    });

    return learner;
  }

  async findByCaseNumber(
    caseNumber: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Learner> {
    const learner = await this.learnersRepository.findOne({
      where: { caseNumber, deletedAt: null },
      relations: ['currentInstitution'],
    });

    if (!learner) {
      throw new NotFoundException(`Learner with case number ${caseNumber} not found`);
    }

    // Access control
    if (userRole !== UserRole.SUPER_ADMIN) {
      this.checkAccess(learner, userId, institutionId);
    }

    return learner;
  }

  async update(
    id: string,
    updateLearnerDto: UpdateLearnerDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Learner> {
    const learner = await this.findOne(id, userId, institutionId, userRole);

    Object.assign(learner, updateLearnerDto);
    learner.lastModifiedBy = userId;

    const updatedLearner = await this.learnersRepository.save(learner);

    // Log update
    await this.auditService.log({
      userId,
      action: AuditAction.LEARNER_UPDATED,
      entityType: 'Learner',
      entityId: updatedLearner.id,
      metadata: {
        caseNumber: updatedLearner.caseNumber,
        changes: updateLearnerDto,
      },
    });

    return updatedLearner;
  }

  async updateStatus(
    id: string,
    status: LearnerStatus,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Learner> {
    const learner = await this.findOne(id, userId, institutionId, userRole);

    learner.status = status;
    learner.lastModifiedBy = userId;

    if (status === LearnerStatus.COMPLETED || status === LearnerStatus.INACTIVE) {
      learner.exitDate = new Date();
    }

    const updatedLearner = await this.learnersRepository.save(learner);

    // Log status change
    await this.auditService.log({
      userId,
      action: AuditAction.LEARNER_UPDATED,
      entityType: 'Learner',
      entityId: updatedLearner.id,
      metadata: {
        caseNumber: updatedLearner.caseNumber,
        statusChange: status,
      },
    });

    return updatedLearner;
  }

  // Replace the addGoal method with this:

async addGoal(
  learnerId: string,
  goalDto: AddGoalDto,
  userId: string,
  institutionId: string,
  userRole: UserRole,
): Promise<Learner> {
  const learner = await this.findOne(learnerId, userId, institutionId, userRole);

  type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'discontinued';

  const newGoal: {
    id: string;
    description: string;
    category: string;
    targetDate: Date;
    status: GoalStatus;
    progress?: number;
    notes?: string;
  } = {
    id: crypto.randomUUID(),
    description: goalDto.description,
    category: goalDto.category,
    targetDate: goalDto.targetDate,
    status: (goalDto.status as GoalStatus) || 'not_started',
    progress: goalDto.progress,
    notes: goalDto.notes,
  };

  learner.goals = [...learner.goals, newGoal];
  learner.lastModifiedBy = userId;

  return this.learnersRepository.save(learner);
}
  async updateGoal(
    learnerId: string,
    goalId: string,
    goalDto: Partial<AddGoalDto>,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Learner> {
    const learner = await this.findOne(learnerId, userId, institutionId, userRole);

    const goalIndex = learner.goals.findIndex((g) => g.id === goalId);
    if (goalIndex === -1) {
      throw new NotFoundException('Goal not found');
    }

    learner.goals[goalIndex] = {
      ...learner.goals[goalIndex],
      ...goalDto,
    };
    learner.lastModifiedBy = userId;

    return this.learnersRepository.save(learner);
  }

  // Case Notes Management
  async createCaseNote(
    learnerId: string,
    createCaseNoteDto: CreateCaseNoteDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<CaseNote> {
    const learner = await this.findOne(learnerId, userId, institutionId, userRole);

    const caseNote = this.caseNotesRepository.create({
      ...createCaseNoteDto,
      learnerId: learner.id,
      authorId: userId,
      institutionId,
    });

    return this.caseNotesRepository.save(caseNote);
  }

  async findCaseNotes(
    learnerId: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<CaseNote[]> {
    const learner = await this.findOne(learnerId, userId, institutionId, userRole);

    return this.caseNotesRepository.find({
      where: { learnerId: learner.id, deletedAt: null },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateCaseNote(
    learnerId: string,
    caseNoteId: string,
    updateCaseNoteDto: UpdateCaseNoteDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<CaseNote> {
    await this.findOne(learnerId, userId, institutionId, userRole);

    const caseNote = await this.caseNotesRepository.findOne({
      where: { id: caseNoteId, learnerId, deletedAt: null },
    });

    if (!caseNote) {
      throw new NotFoundException('Case note not found');
    }

    // Only author or super admin can update
    if (caseNote.authorId !== userId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only update your own case notes');
    }

    Object.assign(caseNote, updateCaseNoteDto);

    return this.caseNotesRepository.save(caseNote);
  }

  async deleteCaseNote(
    learnerId: string,
    caseNoteId: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<void> {
    await this.findOne(learnerId, userId, institutionId, userRole);

    const caseNote = await this.caseNotesRepository.findOne({
      where: { id: caseNoteId, learnerId, deletedAt: null },
    });

    if (!caseNote) {
      throw new NotFoundException('Case note not found');
    }

    // Only author or super admin can delete
    if (caseNote.authorId !== userId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only delete your own case notes');
    }

    caseNote.deletedAt = new Date();
    await this.caseNotesRepository.save(caseNote);
  }

  async remove(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<void> {
    const learner = await this.findOne(id, userId, institutionId, userRole);

    // Soft delete
    learner.deletedAt = new Date();
    learner.lastModifiedBy = userId;
    await this.learnersRepository.save(learner);

    // Log deletion
    await this.auditService.log({
      userId,
      action: AuditAction.LEARNER_DELETED,
      entityType: 'Learner',
      entityId: learner.id,
      metadata: {
        caseNumber: learner.caseNumber,
      },
    });
  }

  async getStatistics(institutionId?: string): Promise<any> {
    const queryBuilder = this.learnersRepository.createQueryBuilder('learner');

    if (institutionId) {
      queryBuilder.where('learner.currentInstitutionId = :institutionId', { institutionId });
    }

    queryBuilder.andWhere('learner.deletedAt IS NULL');

    const total = await queryBuilder.getCount();

    const active = await queryBuilder
      .clone()
      .andWhere('learner.status = :status', { status: LearnerStatus.ACTIVE })
      .getCount();

    const transitioning = await queryBuilder
      .clone()
      .andWhere('learner.status = :status', { status: LearnerStatus.TRANSITIONING })
      .getCount();

    const completed = await queryBuilder
      .clone()
      .andWhere('learner.status = :status', { status: LearnerStatus.COMPLETED })
      .getCount();

    return {
      total,
      active,
      transitioning,
      completed,
    };
  }
}