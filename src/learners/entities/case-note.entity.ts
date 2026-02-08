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
import { Learner } from './learner.entity';
import { User } from '@users/entities/user.entity';

export enum CaseNoteType {
  ACADEMIC = 'academic',
  BEHAVIORAL = 'behavioral',
  SOCIAL = 'social',
  MEDICAL = 'medical',
  COMMUNICATION = 'communication',
  ASSESSMENT = 'assessment',
  INCIDENT = 'incident',
  PROGRESS = 'progress',
  GENERAL = 'general',
}

export enum CaseNotePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('case_notes')
@Index(['learnerId', 'createdAt'])
@Index(['type', 'priority'])
export class CaseNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Learner, (learner) => learner.caseNotes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'learnerId' })
  learner: Learner;

  @Column()
  learnerId: string;

  @Column({
    type: 'enum',
    enum: CaseNoteType,
  })
  type: CaseNoteType;

  @Column({
    type: 'enum',
    enum: CaseNotePriority,
    default: CaseNotePriority.MEDIUM,
  })
  priority: CaseNotePriority;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @Column()
  institutionId: string;

  // Follow-up tracking
  @Column({ default: false })
  requiresFollowUp: boolean;

  @Column({ type: 'date', nullable: true })
  followUpDate: Date;

  @Column({ default: false })
  followUpCompleted: boolean;

  // Visibility control
  @Column({ default: true })
  visibleToTransferringInstitution: boolean;

  @Column({ type: 'jsonb', default: [] })
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}