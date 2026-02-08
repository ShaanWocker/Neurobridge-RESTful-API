import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Transfer, TransferStatus } from './entities/transfer.entity';
import { TransferTimeline, TimelineEventType } from './entities/transfer-timeline.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { ReviewTransferDto } from './dto/review-transfer.dto';
import { AcknowledgeTransferDto } from './dto/acknowledge-transfer.dto';
import { CompleteTransferDto } from './dto/complete-transfer.dto';
import { AddCommunicationDto } from './dto/add-communication.dto';
import { SearchTransferDto } from './dto/search-transfer.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { LearnersService } from '@learners/learners.service';
import { InstitutionsService } from '@institutions/institutions.service';
import { AuditService } from '@audit/audit.service';
import { AuditAction } from '@audit/entities/audit-log.entity';
import { UserRole } from '@users/entities/user.entity';
import { LearnerStatus } from '@learners/entities/learner.entity';
import * as crypto from 'crypto';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfer)
    private transfersRepository: Repository<Transfer>,
    @InjectRepository(TransferTimeline)
    private timelineRepository: Repository<TransferTimeline>,
    private learnersService: LearnersService,
    private institutionsService: InstitutionsService,
    private auditService: AuditService,
  ) {}

  private generateTransferNumber(): string {
    const prefix = 'TR';
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${year}-${random}`;
  }

  private checkTransferAccess(
    transfer: Transfer,
    institutionId: string,
    userRole: UserRole,
  ): void {
    if (userRole === UserRole.SUPER_ADMIN) return;

    const hasAccess =
      transfer.fromInstitutionId === institutionId ||
      transfer.toInstitutionId === institutionId;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this transfer');
    }
  }

  private async addTimelineEvent(
    transferId: string,
    eventType: TimelineEventType,
    description: string,
    performedBy: string,
    eventData?: Record<string, any>,
  ): Promise<void> {
    const timelineEvent = this.timelineRepository.create({
      transferId,
      eventType,
      description,
      performedBy,
      eventData,
    });

    await this.timelineRepository.save(timelineEvent);
  }

  async create(
    createTransferDto: CreateTransferDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Transfer> {
    // Verify learner exists and user has access
    const learner = await this.learnersService.findOne(
      createTransferDto.learnerId,
      userId,
      institutionId,
      userRole,
    );

    // Verify learner belongs to the institution initiating the transfer
    if (learner.currentInstitutionId !== institutionId) {
      throw new ForbiddenException('You can only transfer learners from your institution');
    }

    // Verify destination institution exists
    const toInstitution = await this.institutionsService.findOne(
      createTransferDto.toInstitutionId,
    );

    // Check if there's already a pending transfer for this learner
    const existingTransfer = await this.transfersRepository.findOne({
      where: {
        learnerId: createTransferDto.learnerId,
        status: In([TransferStatus.PENDING, TransferStatus.APPROVED]),
        deletedAt: null,
      },
    });

    if (existingTransfer) {
      throw new ConflictException('There is already a pending transfer for this learner');
    }

    const transferNumber = this.generateTransferNumber();

    const transfer = this.transfersRepository.create({
      ...createTransferDto,
      transferNumber,
      fromInstitutionId: institutionId,
      initiatedBy: userId,
      status: TransferStatus.PENDING,
    });

    const savedTransfer = await this.transfersRepository.save(transfer);

    // Update learner status
    await this.learnersService.updateStatus(
      learner.id,
      LearnerStatus.TRANSITIONING,
      userId,
      institutionId,
      userRole,
    );

    // Add timeline event
    await this.addTimelineEvent(
      savedTransfer.id,
      TimelineEventType.TRANSFER_INITIATED,
      `Transfer initiated to ${toInstitution.name}`,
      userId,
      {
        toInstitutionId: createTransferDto.toInstitutionId,
        reason: createTransferDto.reason,
      },
    );

    // Log audit
    await this.auditService.log({
      userId,
      action: AuditAction.TRANSFER_INITIATED,
      entityType: 'Transfer',
      entityId: savedTransfer.id,
      metadata: {
        transferNumber: savedTransfer.transferNumber,
        learnerId: learner.id,
        fromInstitutionId: institutionId,
        toInstitutionId: createTransferDto.toInstitutionId,
      },
    });

    return savedTransfer;
  }

  async findAll(
    searchDto: SearchTransferDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<PaginatedResponseDto<Transfer>> {
    const { page, limit, learnerId, fromInstitutionId, toInstitutionId, status, priority } =
      searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.transfersRepository.createQueryBuilder('transfer');

    // Access control: non-super-admins only see transfers involving their institution
    if (userRole !== UserRole.SUPER_ADMIN) {
      queryBuilder.andWhere(
        '(transfer.fromInstitutionId = :institutionId OR transfer.toInstitutionId = :institutionId)',
        { institutionId },
      );
    }

    // Filters
    if (learnerId) {
      queryBuilder.andWhere('transfer.learnerId = :learnerId', { learnerId });
    }

    if (fromInstitutionId) {
      queryBuilder.andWhere('transfer.fromInstitutionId = :fromInstitutionId', {
        fromInstitutionId,
      });
    }

    if (toInstitutionId) {
      queryBuilder.andWhere('transfer.toInstitutionId = :toInstitutionId', { toInstitutionId });
    }

    if (status) {
      queryBuilder.andWhere('transfer.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('transfer.priority = :priority', { priority });
    }

    // Exclude deleted
    queryBuilder.andWhere('transfer.deletedAt IS NULL');

    // Joins and pagination
    queryBuilder
      .leftJoinAndSelect('transfer.learner', 'learner')
      .leftJoinAndSelect('transfer.fromInstitution', 'fromInstitution')
      .leftJoinAndSelect('transfer.toInstitution', 'toInstitution')
      .leftJoinAndSelect('transfer.initiator', 'initiator')
      .leftJoinAndSelect('transfer.reviewer', 'reviewer')
      .skip(skip)
      .take(limit)
      .orderBy('transfer.createdAt', 'DESC');

    const [transfers, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: transfers,
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
  ): Promise<Transfer> {
    const transfer = await this.transfersRepository.findOne({
      where: { id, deletedAt: null },
      relations: [
        'learner',
        'fromInstitution',
        'toInstitution',
        'initiator',
        'reviewer',
      ],
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer with ID ${id} not found`);
    }

    // Access control
    this.checkTransferAccess(transfer, institutionId, userRole);

    return transfer;
  }

  async findTimeline(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<TransferTimeline[]> {
    const transfer = await this.findOne(id, userId, institutionId, userRole);

    return this.timelineRepository.find({
      where: { transferId: transfer.id },
      relations: ['performer'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    id: string,
    updateTransferDto: UpdateTransferDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id, userId, institutionId, userRole);

    // Only initiating institution can update before approval
    if (transfer.fromInstitutionId !== institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the initiating institution can update this transfer');
    }

    // Can't update if already approved, rejected, or completed
    if (
      transfer.status !== TransferStatus.PENDING &&
      transfer.status !== TransferStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot update transfer in current status');
    }

    Object.assign(transfer, updateTransferDto);

    const updatedTransfer = await this.transfersRepository.save(transfer);

    // Add timeline event
    await this.addTimelineEvent(
      transfer.id,
      TimelineEventType.STATUS_CHANGED,
      'Transfer details updated',
      userId,
      { changes: updateTransferDto },
    );

    return updatedTransfer;
  }

  async review(
    id: string,
    reviewDto: ReviewTransferDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id, userId, institutionId, userRole);

    // Only receiving institution can review
    if (transfer.toInstitutionId !== institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the receiving institution can review this transfer');
    }

    // Must be in pending status
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer must be in pending status to review');
    }

    transfer.status = reviewDto.status;
    transfer.reviewedBy = userId;
    transfer.reviewedAt = new Date();
    transfer.reviewNotes = reviewDto.reviewNotes;

    if (reviewDto.actualTransferDate) {
      transfer.actualTransferDate = reviewDto.actualTransferDate;
    }

    const updatedTransfer = await this.transfersRepository.save(transfer);

    // Add timeline event
    const eventType =
      reviewDto.status === TransferStatus.APPROVED
        ? TimelineEventType.APPROVED
        : TimelineEventType.REJECTED;

    await this.addTimelineEvent(
      transfer.id,
      eventType,
      `Transfer ${reviewDto.status} by receiving institution`,
      userId,
      { reviewNotes: reviewDto.reviewNotes },
    );

    // Log audit
    const auditAction =
      reviewDto.status === TransferStatus.APPROVED
        ? AuditAction.TRANSFER_APPROVED
        : AuditAction.TRANSFER_REJECTED;

    await this.auditService.log({
      userId,
      action: auditAction,
      entityType: 'Transfer',
      entityId: updatedTransfer.id,
      metadata: {
        transferNumber: updatedTransfer.transferNumber,
        status: reviewDto.status,
      },
    });

    return updatedTransfer;
  }

  async acknowledge(
    id: string,
    acknowledgeDto: AcknowledgeTransferDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id, userId, institutionId, userRole);

    // Only receiving institution can acknowledge
    if (transfer.toInstitutionId !== institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only the receiving institution can acknowledge this transfer',
      );
    }

    // Must be approved
    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestException('Transfer must be approved before acknowledgment');
    }

    transfer.receivingInstitutionAcknowledged = true;
    transfer.acknowledgedBy = userId;
    transfer.acknowledgedAt = new Date();

    if (acknowledgeDto.notes) {
      transfer.metadata = {
        ...transfer.metadata,
        acknowledgmentNotes: acknowledgeDto.notes,
        documentsReceived: acknowledgeDto.documentsReceived,
        readyForEnrollment: acknowledgeDto.readyForEnrollment,
      };
    }

    const updatedTransfer = await this.transfersRepository.save(transfer);

    // Add timeline event
    await this.addTimelineEvent(
      transfer.id,
      TimelineEventType.ACKNOWLEDGED,
      'Transfer acknowledged by receiving institution',
      userId,
      acknowledgeDto,
    );

    return updatedTransfer;
  }

  async complete(
    id: string,
    completeDto: CompleteTransferDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id, userId, institutionId, userRole);

    // Only receiving institution can complete
    if (transfer.toInstitutionId !== institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the receiving institution can complete this transfer');
    }

    // Must be approved and acknowledged
    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestException('Transfer must be approved to complete');
    }

    if (!transfer.receivingInstitutionAcknowledged) {
      throw new BadRequestException('Transfer must be acknowledged before completion');
    }

    // Verify all checklist items
    const checklist = completeDto.completionChecklist;
    const allComplete = Object.values(checklist).every((item) => item === true);

    if (!allComplete) {
      throw new BadRequestException('All checklist items must be completed');
    }

    transfer.status = TransferStatus.COMPLETED;
    transfer.completionChecklist = checklist;
    transfer.actualTransferDate = completeDto.actualTransferDate || new Date();

    const updatedTransfer = await this.transfersRepository.save(transfer);

    // Update learner institution and status
    const learner = await this.learnersService.findOne(
      transfer.learnerId,
      userId,
      institutionId,
      userRole,
    );

    // Add to institution history
    learner.institutionHistory.push({
      institutionId: transfer.fromInstitutionId,
      institutionName: transfer.fromInstitution.name,
      startDate: learner.enrollmentDate,
      endDate: transfer.actualTransferDate,
      reason: transfer.reason,
    });

    // Update current institution
    await this.learnersService.update(
      learner.id,
      {
        currentInstitutionId: transfer.toInstitutionId,
        enrollmentDate: transfer.actualTransferDate,
      },
      userId,
      institutionId,
      userRole,
    );

    // Update learner status back to active
    await this.learnersService.updateStatus(
      learner.id,
      LearnerStatus.ACTIVE,
      userId,
      institutionId,
      userRole,
    );

    // Add timeline event
    await this.addTimelineEvent(
      transfer.id,
      TimelineEventType.COMPLETED,
      'Transfer completed successfully',
      userId,
      { completionChecklist: checklist },
    );

    // Log audit
    await this.auditService.log({
      userId,
      action: AuditAction.TRANSFER_COMPLETED,
      entityType: 'Transfer',
      entityId: updatedTransfer.id,
      metadata: {
        transferNumber: updatedTransfer.transferNumber,
        learnerId: learner.id,
        newInstitutionId: transfer.toInstitutionId,
      },
    });

    return updatedTransfer;
  }

  async addCommunication(
    id: string,
    communicationDto: AddCommunicationDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id, userId, institutionId, userRole);

    // Verify sender is from one of the involved institutions
    if (
      transfer.fromInstitutionId !== institutionId &&
      transfer.toInstitutionId !== institutionId &&
      userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('You cannot add communication to this transfer');
    }

    const communication = {
      id: crypto.randomUUID(),
      from: institutionId,
      to: communicationDto.toInstitutionId,
      message: communicationDto.message,
      sentAt: new Date(),
    };

    transfer.communications = [...transfer.communications, communication];

    const updatedTransfer = await this.transfersRepository.save(transfer);

    // Add timeline event
    await this.addTimelineEvent(
      transfer.id,
      TimelineEventType.COMMUNICATION_SENT,
      'Communication added',
      userId,
      { messagePreview: communicationDto.message.substring(0, 100) },
    );

    return updatedTransfer;
  }

  async cancel(
    id: string,
    reason: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id, userId, institutionId, userRole);

    // Only initiating institution or super admin can cancel
    if (transfer.fromInstitutionId !== institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the initiating institution can cancel this transfer');
    }

    // Can't cancel completed transfers
    if (transfer.status === TransferStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed transfer');
    }

    transfer.status = TransferStatus.CANCELLED;
    transfer.metadata = {
      ...transfer.metadata,
      cancellationReason: reason,
      cancelledBy: userId,
      cancelledAt: new Date(),
    };

    const updatedTransfer = await this.transfersRepository.save(transfer);

    // Update learner status back to active
    await this.learnersService.updateStatus(
      transfer.learnerId,
      LearnerStatus.ACTIVE,
      userId,
      institutionId,
      userRole,
    );

    // Add timeline event
    await this.addTimelineEvent(
      transfer.id,
      TimelineEventType.CANCELLED,
      `Transfer cancelled: ${reason}`,
      userId,
      { reason },
    );

    return updatedTransfer;
  }

  async getStatistics(institutionId?: string): Promise<any> {
    const queryBuilder = this.transfersRepository.createQueryBuilder('transfer');

    if (institutionId) {
      queryBuilder.where(
        '(transfer.fromInstitutionId = :institutionId OR transfer.toInstitutionId = :institutionId)',
        { institutionId },
      );
    }

    queryBuilder.andWhere('transfer.deletedAt IS NULL');

    const total = await queryBuilder.getCount();

    const pending = await queryBuilder
      .clone()
      .andWhere('transfer.status = :status', { status: TransferStatus.PENDING })
      .getCount();

    const approved = await queryBuilder
      .clone()
      .andWhere('transfer.status = :status', { status: TransferStatus.APPROVED })
      .getCount();

    const completed = await queryBuilder
      .clone()
      .andWhere('transfer.status = :status', { status: TransferStatus.COMPLETED })
      .getCount();

    const rejected = await queryBuilder
      .clone()
      .andWhere('transfer.status = :status', { status: TransferStatus.REJECTED })
      .getCount();

    return {
      total,
      pending,
      approved,
      completed,
      rejected,
    };
  }

  async remove(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<void> {
    const transfer = await this.findOne(id, userId, institutionId, userRole);

    // Only super admin can delete
    if (userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can delete transfers');
    }

    transfer.deletedAt = new Date();
    await this.transfersRepository.save(transfer);
  }
}