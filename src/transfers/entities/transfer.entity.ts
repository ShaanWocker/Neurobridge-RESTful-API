import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Institution } from '@institutions/entities/institution.entity';
import { Learner } from '@learners/entities/learner.entity';
import { User } from '@users/entities/user.entity';

export enum TransferStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TransferPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TransferReason {
  PROGRAM_COMPLETION = 'program_completion',
  GEOGRAPHICAL_RELOCATION = 'geographical_relocation',
  SPECIALIZED_SUPPORT_NEEDED = 'specialized_support_needed',
  CAPACITY_CONSTRAINTS = 'capacity_constraints',
  FAMILY_REQUEST = 'family_request',
  IMPROVED_FIT = 'improved_fit',
  OTHER = 'other',
}

@Entity('transfers')
@Index(['status', 'createdAt'])
@Index(['fromInstitutionId', 'toInstitutionId'])
@Index(['learnerId'])
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transferNumber: string;

  // Learner being transferred
  @ManyToOne(() => Learner, (learner) => learner.transfers, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'learnerId' })
  learner: Learner;

  @Column()
  learnerId: string;

  // Source institution
  @ManyToOne(() => Institution, (institution) => institution.transfersFrom, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'fromInstitutionId' })
  fromInstitution: Institution;

  @Column()
  fromInstitutionId: string;

  // Destination institution
  @ManyToOne(() => Institution, (institution) => institution.transfersTo, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'toInstitutionId' })
  toInstitution: Institution;

  @Column()
  toInstitutionId: string;

  // Transfer details
  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
  })
  status: TransferStatus;

  @Column({
    type: 'enum',
    enum: TransferPriority,
    default: TransferPriority.NORMAL,
  })
  priority: TransferPriority;

  @Column({
    type: 'enum',
    enum: TransferReason,
  })
  reason: TransferReason;

  @Column({ type: 'text' })
  reasonDetails: string;

  @Column({ type: 'date' })
  proposedTransferDate: Date;

  @Column({ type: 'date', nullable: true })
  actualTransferDate: Date;

  // Initiator and approver
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'initiatedBy' })
  initiator: User;

  @Column()
  initiatedBy: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  // Case handover information
  @Column({ type: 'jsonb', nullable: true })
  handoverSummary: {
    currentStatus: string;
    keyAchievements: string[];
    ongoingChallenges: string[];
    recommendedStrategies: string[];
    specialConsiderations: string[];
  };

  @Column({ type: 'jsonb', default: [] })
  sharedDocuments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    sharedAt: Date;
  }>;

  @Column({ type: 'jsonb', default: [] })
  sharedCaseNotes: string[]; // Array of case note IDs

  // Communication & coordination
  @Column({ type: 'jsonb', default: [] })
  communications: Array<{
    id: string;
    from: string;
    to: string;
    message: string;
    sentAt: Date;
    readAt?: Date;
  }>;

  @Column({ default: false })
  coordinationMeetingRequired: boolean;

  @Column({ type: 'timestamp', nullable: true })
  coordinationMeetingDate: Date;

  @Column({ type: 'text', nullable: true })
  coordinationMeetingNotes: string;

  // Receiving institution acknowledgment
  @Column({ default: false })
  receivingInstitutionAcknowledged: boolean;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ nullable: true })
  acknowledgedBy: string;

  // Completion checklist
  @Column({ type: 'jsonb', nullable: true })
  completionChecklist: {
    documentsTransferred: boolean;
    caseNotesShared: boolean;
    parentNotified: boolean;
    enrollmentCompleted: boolean;
    previousInstitutionNotified: boolean;
    transitionPlanCreated: boolean;
  };

  // Follow-up
  @Column({ default: false })
  requiresFollowUp: boolean;

  @Column({ type: 'date', nullable: true })
  followUpDate: Date;

  @Column({ type: 'text', nullable: true })
  followUpNotes: string;

  @Column({ default: false })
  followUpCompleted: boolean;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}