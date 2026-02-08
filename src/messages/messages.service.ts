import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In, IsNull, Not, Between } from 'typeorm';
import { Message, MessageStatus } from './entities/message.entity';
import { MessageDraft } from './entities/message-draft.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SearchMessageDto } from './dto/search-message.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { AuditService } from '@audit/audit.service';
import { AuditAction } from '@audit/entities/audit-log.entity';
import { UserRole } from '@users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(MessageDraft)
    private draftsRepository: Repository<MessageDraft>,
    @InjectRepository(MessageAttachment)
    private attachmentsRepository: Repository<MessageAttachment>,
    private auditService: AuditService,
  ) {}

  private checkMessageAccess(
    message: Message,
    institutionId: string,
    userRole: UserRole,
  ): void {
    if (userRole === UserRole.SUPER_ADMIN) return;

    const hasAccess =
      message.fromInstitutionId === institutionId ||
      message.toInstitutionId === institutionId;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this message');
    }
  }

  async create(
    createMessageDto: CreateMessageDto,
    userId: string,
    institutionId: string,
  ): Promise<Message> {
    // Generate thread ID if this is a reply
    let threadId = null;
    if (createMessageDto.replyToId) {
      const parentMessage = await this.messagesRepository.findOne({
        where: { id: createMessageDto.replyToId, deletedAt: null },
      });

      if (!parentMessage) {
        throw new NotFoundException('Parent message not found');
      }

      threadId = parentMessage.threadId || parentMessage.id;
    }

    const message = this.messagesRepository.create({
      ...createMessageDto,
      fromInstitutionId: institutionId,
      sentBy: userId,
      threadId,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messagesRepository.save(message);

    // Log message sent
    await this.auditService.log({
      userId,
      action: AuditAction.MESSAGE_SENT,
      entityType: 'Message',
      entityId: savedMessage.id,
      metadata: {
        toInstitutionId: createMessageDto.toInstitutionId,
        subject: createMessageDto.subject,
        category: createMessageDto.category,
        learnerId: createMessageDto.learnerId,
        transferId: createMessageDto.transferId,
      },
    });

    return savedMessage;
  }

  async findAll(
    searchDto: SearchMessageDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<PaginatedResponseDto<Message>> {
    const {
      page,
      limit,
      fromInstitutionId,
      toInstitutionId,
      category,
      priority,
      status,
      learnerId,
      transferId,
      search,
      unreadOnly,
      starred,
      archived,
      threadId,
      fromDate,
      toDate,
    } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.messagesRepository.createQueryBuilder('message');

    // Access control: non-super-admins only see messages involving their institution
    if (userRole !== UserRole.SUPER_ADMIN) {
      queryBuilder.andWhere(
        '(message.fromInstitutionId = :institutionId OR message.toInstitutionId = :institutionId)',
        { institutionId },
      );
    }

    // Filters
    if (fromInstitutionId) {
      queryBuilder.andWhere('message.fromInstitutionId = :fromInstitutionId', {
        fromInstitutionId,
      });
    }

    if (toInstitutionId) {
      queryBuilder.andWhere('message.toInstitutionId = :toInstitutionId', { toInstitutionId });
    }

    if (category) {
      queryBuilder.andWhere('message.category = :category', { category });
    }

    if (priority) {
      queryBuilder.andWhere('message.priority = :priority', { priority });
    }

    if (status) {
      queryBuilder.andWhere('message.status = :status', { status });
    }

    if (learnerId) {
      queryBuilder.andWhere('message.learnerId = :learnerId', { learnerId });
    }

    if (transferId) {
      queryBuilder.andWhere('message.transferId = :transferId', { transferId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(message.subject) LIKE LOWER(:search) OR LOWER(message.body) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (unreadOnly) {
      queryBuilder.andWhere('message.isRead = :isRead', { isRead: false });
      queryBuilder.andWhere('message.toInstitutionId = :institutionId', { institutionId });
    }

    if (starred !== undefined) {
      if (userRole !== UserRole.SUPER_ADMIN) {
        const starredField =
          institutionId === fromInstitutionId ? 'starredBySender' : 'starredByRecipient';
        queryBuilder.andWhere(`message.${starredField} = :starred`, { starred });
      }
    }

    if (archived !== undefined) {
      if (userRole !== UserRole.SUPER_ADMIN) {
        const archivedField =
          institutionId === fromInstitutionId ? 'archivedBySender' : 'archivedByRecipient';
        queryBuilder.andWhere(`message.${archivedField} = :archived`, { archived });
      }
    }

    if (threadId) {
      queryBuilder.andWhere('message.threadId = :threadId', { threadId });
    }

    // Date range filter
    if (fromDate) {
      queryBuilder.andWhere('message.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('message.createdAt <= :toDate', { toDate });
    }

    // Exclude deleted
    queryBuilder.andWhere('message.deletedAt IS NULL');

    // Joins and pagination
    queryBuilder
      .leftJoinAndSelect('message.fromInstitution', 'fromInstitution')
      .leftJoinAndSelect('message.toInstitution', 'toInstitution')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.learner', 'learner')
      .leftJoinAndSelect('message.transfer', 'transfer')
      .leftJoinAndSelect('message.attachments', 'attachments')
      .leftJoinAndSelect('message.replyTo', 'replyTo')
      .skip(skip)
      .take(limit)
      .orderBy('message.createdAt', 'DESC');

    const [messages, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: messages,
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
  ): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id, deletedAt: null },
      relations: [
        'fromInstitution',
        'toInstitution',
        'sender',
        'learner',
        'transfer',
        'attachments',
        'replyTo',
        'replies',
      ],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Access control
    this.checkMessageAccess(message, institutionId, userRole);

    return message;
  }

  async findThread(
    threadId: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Message[]> {
    const queryBuilder = this.messagesRepository.createQueryBuilder('message');

    queryBuilder
      .where('(message.id = :threadId OR message.threadId = :threadId)', { threadId })
      .andWhere('message.deletedAt IS NULL');

    // Access control
    if (userRole !== UserRole.SUPER_ADMIN) {
      queryBuilder.andWhere(
        '(message.fromInstitutionId = :institutionId OR message.toInstitutionId = :institutionId)',
        { institutionId },
      );
    }

    queryBuilder
      .leftJoinAndSelect('message.fromInstitution', 'fromInstitution')
      .leftJoinAndSelect('message.toInstitution', 'toInstitution')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.attachments', 'attachments')
      .orderBy('message.createdAt', 'ASC');

    return queryBuilder.getMany();
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Message> {
    const message = await this.findOne(id, userId, institutionId, userRole);

    // Only sender can update (and only before it's read)
    if (message.fromInstitutionId !== institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the sender can update this message');
    }

    if (message.isRead) {
      throw new BadRequestException('Cannot update a message that has been read');
    }

    Object.assign(message, updateMessageDto);

    return this.messagesRepository.save(message);
  }

  async markAsRead(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Message> {
    const message = await this.findOne(id, userId, institutionId, userRole);

    // Only recipient can mark as read
    if (message.toInstitutionId !== institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the recipient can mark this message as read');
    }

    message.isRead = true;
    message.readAt = new Date();
    message.readBy = userId;
    message.status = MessageStatus.READ;

    // Add to read receipts
    message.readReceipts = [
      ...message.readReceipts,
      {
        userId,
        userName: 'User', // This should be fetched from user service
        readAt: new Date(),
      },
    ];

    const updatedMessage = await this.messagesRepository.save(message);

    // Log message read
    await this.auditService.log({
      userId,
      action: AuditAction.MESSAGE_READ,
      entityType: 'Message',
      entityId: updatedMessage.id,
    });

    return updatedMessage;
  }

  async markMultipleAsRead(
    markAsReadDto: MarkAsReadDto,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<void> {
    const { messageIds } = markAsReadDto;

    if (!messageIds || messageIds.length === 0) {
      throw new BadRequestException('No message IDs provided');
    }

    const messages = await this.messagesRepository.find({
      where: {
        id: In(messageIds),
        toInstitutionId: institutionId,
        isRead: false,
        deletedAt: null,
      },
    });

    const now = new Date();
    const readReceipt = {
      userId,
      userName: 'User',
      readAt: now,
    };

    for (const message of messages) {
      message.isRead = true;
      message.readAt = now;
      message.readBy = userId;
      message.status = MessageStatus.READ;
      message.readReceipts = [...message.readReceipts, readReceipt];
    }

    await this.messagesRepository.save(messages);
  }

  async toggleStar(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Message> {
    const message = await this.findOne(id, userId, institutionId, userRole);

    if (message.fromInstitutionId === institutionId) {
      message.starredBySender = !message.starredBySender;
    } else if (message.toInstitutionId === institutionId) {
      message.starredByRecipient = !message.starredByRecipient;
    }

    return this.messagesRepository.save(message);
  }

  async archive(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Message> {
    const message = await this.findOne(id, userId, institutionId, userRole);

    if (message.fromInstitutionId === institutionId) {
      message.archivedBySender = true;
    } else if (message.toInstitutionId === institutionId) {
      message.archivedByRecipient = true;
    }

    message.archivedAt = new Date();
    message.status = MessageStatus.ARCHIVED;

    return this.messagesRepository.save(message);
  }

  async unarchive(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<Message> {
    const message = await this.findOne(id, userId, institutionId, userRole);

    if (message.fromInstitutionId === institutionId) {
      message.archivedBySender = false;
    } else if (message.toInstitutionId === institutionId) {
      message.archivedByRecipient = false;
    }

    // Update status based on read state
    message.status = message.isRead ? MessageStatus.READ : MessageStatus.DELIVERED;

    return this.messagesRepository.save(message);
  }

  // Draft management
  async createDraft(
    createDraftDto: CreateDraftDto,
    userId: string,
    institutionId: string,
  ): Promise<MessageDraft> {
    const draft = this.draftsRepository.create({
      ...createDraftDto,
      fromInstitutionId: institutionId,
      createdBy: userId,
    });

    return this.draftsRepository.save(draft);
  }

  async findAllDrafts(
    userId: string,
    institutionId: string,
  ): Promise<MessageDraft[]> {
    return this.draftsRepository.find({
      where: {
        createdBy: userId,
        fromInstitutionId: institutionId,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async updateDraft(
    id: string,
    updateDraftDto: CreateDraftDto,
    userId: string,
  ): Promise<MessageDraft> {
    const draft = await this.draftsRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    Object.assign(draft, updateDraftDto);

    return this.draftsRepository.save(draft);
  }

  async deleteDraft(id: string, userId: string): Promise<void> {
    const draft = await this.draftsRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    await this.draftsRepository.remove(draft);
  }

  async sendDraft(
    draftId: string,
    userId: string,
    institutionId: string,
  ): Promise<Message> {
    const draft = await this.draftsRepository.findOne({
      where: { id: draftId, createdBy: userId },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    if (!draft.subject || !draft.body || !draft.toInstitutionId) {
      throw new BadRequestException('Draft is incomplete');
    }

    const createMessageDto: CreateMessageDto = {
      toInstitutionId: draft.toInstitutionId,
      subject: draft.subject,
      body: draft.body,
      category: draft.category,
      priority: draft.priority,
      learnerId: draft.learnerId,
      transferId: draft.transferId,
      replyToId: draft.replyToId,
    };

    const message = await this.create(createMessageDto, userId, institutionId);

    // Delete the draft after sending
    await this.draftsRepository.remove(draft);

    return message;
  }

  async getStatistics(institutionId?: string): Promise<any> {
    const queryBuilder = this.messagesRepository.createQueryBuilder('message');

    if (institutionId) {
      queryBuilder.where(
        '(message.fromInstitutionId = :institutionId OR message.toInstitutionId = :institutionId)',
        { institutionId },
      );
    }

    queryBuilder.andWhere('message.deletedAt IS NULL');

    const total = await queryBuilder.getCount();

    const sent = institutionId
      ? await queryBuilder
          .clone()
          .andWhere('message.fromInstitutionId = :institutionId', { institutionId })
          .getCount()
      : 0;

    const received = institutionId
      ? await queryBuilder
          .clone()
          .andWhere('message.toInstitutionId = :institutionId', { institutionId })
          .getCount()
      : 0;

    const unread = institutionId
      ? await queryBuilder
          .clone()
          .andWhere('message.toInstitutionId = :institutionId', { institutionId })
          .andWhere('message.isRead = :isRead', { isRead: false })
          .getCount()
      : 0;

    const threads = await this.messagesRepository
      .createQueryBuilder('message')
      .select('DISTINCT message.threadId')
      .where('message.threadId IS NOT NULL')
      .andWhere('message.deletedAt IS NULL')
      .getCount();

    return {
      total,
      sent,
      received,
      unread,
      threads,
    };
  }

  async remove(
    id: string,
    userId: string,
    institutionId: string,
    userRole: UserRole,
  ): Promise<void> {
    const message = await this.findOne(id, userId, institutionId, userRole);

    // Only sender or super admin can delete
    if (message.fromInstitutionId !== institutionId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the sender can delete this message');
    }

    message.deletedAt = new Date();
    await this.messagesRepository.save(message);
  }
}