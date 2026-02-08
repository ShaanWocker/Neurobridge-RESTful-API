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
import { Transfer } from '@transfers/entities/transfer.entity';
import { CaseNote } from './case-note.entity';
import { Exclude } from 'class-transformer';

export enum LearnerStatus {
  ACTIVE = 'active',
  TRANSITIONING = 'transitioning',
  COMPLETED = 'completed',
  INACTIVE = 'inactive',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

@Entity('learners')
@Index(['currentInstitutionId', 'status'])
@Index(['caseNumber'], { unique: true })
export class Learner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  caseNumber: string;

  // Basic Information (Limited PII)
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  // Current Status
  @Column({
    type: 'enum',
    enum: LearnerStatus,
    default: LearnerStatus.ACTIVE,
  })
  status: LearnerStatus;

  // Current Institution
  @ManyToOne(() => Institution, (institution) => institution.currentLearners, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'currentInstitutionId' })
  currentInstitution: Institution;

  @Column()
  currentInstitutionId: string;

  // Enrollment Information
  @Column({ type: 'date' })
  enrollmentDate: Date;

  @Column({ type: 'date', nullable: true })
  exitDate: Date;

  @Column({ nullable: true })
  currentGrade: string;

  // Support Needs & Diagnoses
  @Column({ type: 'jsonb', default: [] })
  diagnoses: Array<{
    condition: string;
    diagnosedDate: Date;
    diagnosedBy: string;
    notes?: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  supportNeeds: string[];

  @Column({ type: 'jsonb', default: [] })
  interventions: Array<{
    type: string;
    provider: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
    notes?: string;
  }>;

  // Academic Information
  @Column({ type: 'jsonb', nullable: true })
  academicProfile: {
    strengths?: string[];
    challenges?: string[];
    learningStyle?: string;
    accommodations?: string[];
  };

  // Behavioral & Social
  @Column({ type: 'jsonb', nullable: true })
  behavioralProfile: {
    strengths?: string[];
    challenges?: string[];
    triggers?: string[];
    strategies?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  socialProfile: {
    strengths?: string[];
    challenges?: string[];
    peerInteractions?: string;
    communication?: string;
  };

  // Emergency & Medical Information (Encrypted in production)
  @Column({ type: 'jsonb', nullable: true })
  @Exclude()
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };

  @Column({ type: 'jsonb', default: [] })
  @Exclude()
  medicalInformation: Array<{
    condition: string;
    medication?: string;
    dosage?: string;
    notes?: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  allergies: string[];

  // Goals & Progress
  @Column({ type: 'jsonb', default: [] })
  goals: Array<{
    id: string;
    description: string;
    category: string;
    targetDate: Date;
    status: 'not_started' | 'in_progress' | 'achieved' | 'discontinued';
    progress?: number;
    notes?: string;
  }>;

  // Documents & Assessments
  @Column({ type: 'jsonb', default: [] })
  documents: Array<{
    id: string;
    type: string;
    name: string;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
    sharedWith?: string[];
  }>;

  @Column({ type: 'jsonb', default: [] })
  assessments: Array<{
    id: string;
    type: string;
    assessor: string;
    date: Date;
    results: any;
    recommendations?: string[];
  }>;

  // Transfer History
  @Column({ type: 'jsonb', default: [] })
  institutionHistory: Array<{
    institutionId: string;
    institutionName: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
  }>;

  @OneToMany(() => Transfer, (transfer) => transfer.learner)
  transfers: Transfer[];

  // Case Notes
  @OneToMany(() => CaseNote, (caseNote) => caseNote.learner, {
    cascade: true,
  })
  caseNotes: CaseNote[];

  // Privacy & Consent
  @Column({ default: false })
  consentForSharing: boolean;

  @Column({ type: 'jsonb', default: [] })
  consentDetails: Array<{
    type: string;
    granted: boolean;
    grantedBy: string;
    grantedAt: Date;
    expiresAt?: Date;
  }>;

  // Data Access Control
  @Column({ type: 'jsonb', default: [] })
  authorizedInstitutions: string[];

  @Column({ type: 'jsonb', default: [] })
  authorizedUsers: string[];

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  lastModifiedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Computed field: Age
  get age(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}