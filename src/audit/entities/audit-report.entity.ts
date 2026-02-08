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
import { User } from '@users/entities/user.entity';

export enum ReportType {
  USER_ACTIVITY = 'user_activity',
  INSTITUTION_ACTIVITY = 'institution_activity',
  LEARNER_ACCESS = 'learner_access',
  TRANSFER_AUDIT = 'transfer_audit',
  MESSAGE_AUDIT = 'message_audit',
  SECURITY_INCIDENTS = 'security_incidents',
  PRIVACY_COMPLIANCE = 'privacy_compliance',
  DATA_ACCESS = 'data_access',
  CUSTOM = 'custom',
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'excel',
}

@Entity('audit_reports')
@Index(['generatedBy', 'createdAt'])
@Index(['status', 'createdAt'])
export class AuditReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  type: ReportType;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Report parameters
  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  filters: {
    userId?: string;
    institutionId?: string;
    actions?: string[];
    categories?: string[];
    severities?: string[];
    entityTypes?: string[];
  };

  // Generation details
  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({
    type: 'enum',
    enum: ReportFormat,
  })
  format: ReportFormat;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'generatedBy' })
  generator: User;

  @Column()
  generatedBy: string;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ type: 'timestamp', nullable: true })
  generatedAt: Date;

  // Report results
  @Column({ type: 'int', nullable: true })
  totalRecords: number;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ type: 'jsonb', nullable: true })
  summary: {
    totalActions: number;
    uniqueUsers: number;
    criticalEvents: number;
    securityIncidents: number;
    topActions: Array<{ action: string; count: number }>;
    activityByDay: Array<{ date: string; count: number }>;
  };

  // Error tracking
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  // Access & retention
  @Column({ default: false })
  isScheduled: boolean;

  @Column({ nullable: true })
  scheduleExpression: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}