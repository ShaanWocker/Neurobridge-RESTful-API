import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Institution } from '@institutions/entities/institution.entity';
import { User } from '@users/entities/user.entity';
import { Learner } from '@learners/entities/learner.entity';
import { Transfer } from '@transfers/entities/transfer.entity';
import { MessageAttachment } from './message-attachment.entity';

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  ARCHIVED = 'archived',
}

export enum MessageCategory {
  GENERAL = 'general',
  LEARNER_INQUIRY = 'learner_inquiry',
  TRANSFER_RELATED = 'transfer_related',
  COLLABORATION = 'collaboration',
  SUPPORT_REQUEST = 'support_request',
  ADMINISTRATIVE = 'administrative',
}

@Entity('messages')
@Index(['fromInstitutionId', 'toInstitutionId', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['learnerId'])
@Index(['transferId'])
@Index(['threadId'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Sender information
  @ManyToOne(() => Institution, (institution) => institution.sentMessages, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'fromInstitutionId' })
  fromInstitution: Institution;

  @Column()
  fromInstitutionId: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'sentBy' })
  sender: User;

  @Column()
  sentBy: string;

  // Recipient information
  @ManyToOne(() => Institution, (institution) => institution.receivedMessages, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'toInstitutionId' })
  toInstitution: Institution;

  @Column()
  toInstitutionId: string;

  // Message content
  @Column()
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({
    type: 'enum',
    enum: MessageCategory,
    default: MessageCategory.GENERAL,
  })
  category: MessageCategory;

  @Column({
    type: 'enum',
    enum: MessagePriority,
    default: MessagePriority.NORMAL,
  })
  priority: MessagePriority;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  // Context linking
  @ManyToOne(() => Learner, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'learnerId' })
  learner: Learner;

  @Column({ nullable: true })
  learnerId: string;

  @ManyToOne(() => Transfer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transferId' })
  transfer: Transfer;

  @Column({ nullable: true })
  transferId: string;

  // Threading
  @Column({ nullable: true })
  threadId: string;

  @ManyToOne(() => Message, (message) => message.replies, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'replyToId' })
  replyTo: Message;

  @Column({ nullable: true })
  replyToId: string;

  @OneToMany(() => Message, (message) => message.replyTo)
  replies: Message[];

  // Attachments
  @OneToMany(() => MessageAttachment, (attachment) => attachment.message, {
    cascade: true,
  })
  attachments: MessageAttachment[];

  // Read tracking
  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ nullable: true })
  readBy: string;

  @Column({ type: 'jsonb', default: [] })
  readReceipts: Array<{
    userId: string;
    userName: string;
    readAt: Date;
  }>;

  // Archive status
  @Column({ default: false })
  archivedBySender: boolean;

  @Column({ default: false })
  archivedByRecipient: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  // Starred/Important
  @Column({ default: false })
  starredBySender: boolean;

  @Column({ default: false })
  starredByRecipient: boolean;

  // Flags
  @Column({ default: false })
  requiresResponse: boolean;

  @Column({ type: 'date', nullable: true })
  responseDeadline: Date;

  @Column({ default: false })
  confidential: boolean;

  @Column({ default: false })
  systemGenerated: boolean;

  // Tags for categorization
  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Computed properties
  get isThread(): boolean {
    return !!this.threadId;
  }

  get hasAttachments(): boolean {
    return this.attachments && this.attachments.length > 0;
  }
}