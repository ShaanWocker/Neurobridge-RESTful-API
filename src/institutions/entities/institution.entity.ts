import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '@users/entities/user.entity';
import { Learner } from '@learners/entities/learner.entity';
import { Transfer } from '@transfers/entities/transfer.entity';
import { Message } from '@messages/entities/message.entity';

export enum InstitutionType {
  SCHOOL = 'school',
  TUTOR_CENTRE = 'tutor_centre',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum InstitutionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('institutions')
@Index(['type', 'status'])
@Index(['verificationStatus'])
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
  })
  type: InstitutionType;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({
    type: 'enum',
    enum: InstitutionStatus,
    default: InstitutionStatus.ACTIVE,
  })
  status: InstitutionStatus;

  // Contact Information
  @Column({ unique: true })
  email: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  website: string;

  // Address
  @Column()
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2: string;

  @Column()
  city: string;

  @Column()
  province: string;

  @Column()
  postalCode: string;

  @Column()
  country: string;

  // Geolocation for search/filtering
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  // Institutional Details
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  mission: string;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({ nullable: true })
  accreditation: string;

  // Capacity & Age Range
  @Column({ type: 'int', nullable: true })
  currentCapacity: number;

  @Column({ type: 'int', nullable: true })
  maxCapacity: number;

  @Column({ type: 'int', nullable: true })
  minAgeSupported: number;

  @Column({ type: 'int', nullable: true })
  maxAgeSupported: number;

  // Specializations - stored as JSON array
  @Column({ type: 'jsonb', default: [] })
  specializations: string[];

  // Support Needs - stored as JSON array
  @Column({ type: 'jsonb', default: [] })
  supportNeeds: string[];

  // Programs Offered
  @Column({ type: 'jsonb', default: [] })
  programs: Array<{
    name: string;
    description: string;
    ageRange: string;
    capacity: number;
  }>;

  // Staff Information
  @Column({ type: 'int', nullable: true })
  totalStaff: number;

  @Column({ type: 'int', nullable: true })
  specializedStaff: number;

  @Column({ type: 'jsonb', default: [] })
  qualifications: string[];

  // Facilities
  @Column({ type: 'jsonb', default: [] })
  facilities: string[];

  // Verification Details
  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'text', nullable: true })
  verificationNotes: string;

  // Documents (stored as references/URLs)
  @Column({ type: 'jsonb', default: [] })
  documents: Array<{
    type: string;
    name: string;
    url: string;
    uploadedAt: Date;
  }>;

  // Operating Hours
  @Column({ type: 'jsonb', nullable: true })
  operatingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };

  // Social Media & External Links
  @Column({ type: 'jsonb', default: {} })
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };

  // Relationships
  @OneToMany(() => User, (user) => user.institution)
  users: User[];

  @OneToMany(() => Learner, (learner) => learner.currentInstitution)
  currentLearners: Learner[];

  @OneToMany(() => Transfer, (transfer) => transfer.fromInstitution)
  transfersFrom: Transfer[];

  @OneToMany(() => Transfer, (transfer) => transfer.toInstitution)
  transfersTo: Transfer[];

  @OneToMany(() => Message, (message) => message.fromInstitution)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.toInstitution)
  receivedMessages: Message[];

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