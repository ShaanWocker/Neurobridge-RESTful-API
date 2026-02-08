import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '@users/entities/user.entity';

export enum AuditAction {
  // User actions
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_SUSPENDED = 'user_suspended',
  USER_ACTIVATED = 'user_activated',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  EMAIL_VERIFIED = 'email_verified',
  PROFILE_VIEWED = 'profile_viewed',

  // Institution actions
  INSTITUTION_CREATED = 'institution_created',
  INSTITUTION_UPDATED = 'institution_updated',
  INSTITUTION_VERIFIED = 'institution_verified',
  INSTITUTION_REJECTED = 'institution_rejected',
  INSTITUTION_SUSPENDED = 'institution_suspended',
  INSTITUTION_DELETED = 'institution_deleted',
  INSTITUTION_VIEWED = 'institution_viewed',

  // Learner actions
  LEARNER_CREATED = 'learner_created',
  LEARNER_UPDATED = 'learner_updated',
  LEARNER_VIEWED = 'learner_viewed',
  LEARNER_DELETED = 'learner_deleted',
  LEARNER_STATUS_CHANGED = 'learner_status_changed',
  LEARNER_CASE_NOTE_ADDED = 'learner_case_note_added',
  LEARNER_CASE_NOTE_UPDATED = 'learner_case_note_updated',
  LEARNER_CASE_NOTE_DELETED = 'learner_case_note_deleted',
  LEARNER_GOAL_ADDED = 'learner_goal_added',
  LEARNER_GOAL_UPDATED = 'learner_goal_updated',
  LEARNER_DOCUMENT_UPLOADED = 'learner_document_uploaded',
  LEARNER_DOCUMENT_ACCESSED = 'learner_document_accessed',
  LEARNER_DOCUMENT_DELETED = 'learner_document_deleted',
  LEARNER_DATA_EXPORTED = 'learner_data_exported',

  // Transfer actions
  TRANSFER_INITIATED = 'transfer_initiated',
  TRANSFER_UPDATED = 'transfer_updated',
  TRANSFER_APPROVED = 'transfer_approved',
  TRANSFER_REJECTED = 'transfer_rejected',
  TRANSFER_ACKNOWLEDGED = 'transfer_acknowledged',
  TRANSFER_COMPLETED = 'transfer_completed',
  TRANSFER_CANCELLED = 'transfer_cancelled',
  TRANSFER_VIEWED = 'transfer_viewed',
  TRANSFER_COMMUNICATION_ADDED = 'transfer_communication_added',

  // Message actions
  MESSAGE_SENT = 'message_sent',
  MESSAGE_READ = 'message_read',
  MESSAGE_UPDATED = 'message_updated',
  MESSAGE_DELETED = 'message_deleted',
  MESSAGE_ARCHIVED = 'message_archived',
  MESSAGE_DRAFT_SAVED = 'message_draft_saved',

  // Permission & Access actions
  PERMISSION_DENIED = 'permission_denied',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_REVOKED = 'access_revoked',

  // Data privacy actions
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_REVOKED = 'consent_revoked',
  DATA_SHARED = 'data_shared',
  DATA_ACCESS_REQUEST = 'data_access_request',
  DATA_DELETION_REQUEST = 'data_deletion_request',
  DATA_EXPORT_REQUEST = 'data_export_request',

  // System actions
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  MAINTENANCE_MODE_ENABLED = 'maintenance_mode_enabled',
  MAINTENANCE_MODE_DISABLED = 'maintenance_mode_disabled',

  // Search & Discovery
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
  REPORT_GENERATED = 'report_generated',
  EXPORT_PERFORMED = 'export_performed',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  COMMUNICATION = 'communication',
  PRIVACY = 'privacy',
  SECURITY = 'security',
  SYSTEM = 'system',
  COMPLIANCE = 'compliance',
}

@Entity('audit_logs')
@Index(['userId', 'action', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['action', 'createdAt'])
@Index(['severity', 'createdAt'])
@Index(['category', 'createdAt'])
@Index(['institutionId', 'createdAt'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User who performed the action
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: true })
  userRole: string;

  // Institution context
  @Column({ nullable: true })
  institutionId: string;

  @Column({ nullable: true })
  institutionName: string;

  // Action details
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditCategory,
  })
  category: AuditCategory;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.INFO,
  })
  severity: AuditSeverity;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Entity affected
  @Column()
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true })
  entityName: string;

  // Request details
  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  requestId: string;

  @Column({ nullable: true })
  sessionId: string;

  // Additional context
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  previousValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  // Result
  @Column({ default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  statusCode: number;

  // Compliance & Privacy
  @Column({ default: false })
  containsPII: boolean;

  @Column({ default: false })
  requiresNotification: boolean;

  @Column({ default: false })
  notificationSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  notificationSentAt: Date;

  // Tags for custom categorization
  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}