import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Transfer } from './transfer.entity';
import { User } from '@users/entities/user.entity';

export enum TimelineEventType {
  TRANSFER_INITIATED = 'transfer_initiated',
  DOCUMENTS_SHARED = 'documents_shared',
  CASE_NOTES_SHARED = 'case_notes_shared',
  COMMUNICATION_SENT = 'communication_sent',
  MEETING_SCHEDULED = 'meeting_scheduled',
  MEETING_COMPLETED = 'meeting_completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACKNOWLEDGED = 'acknowledged',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  STATUS_CHANGED = 'status_changed',
  COMMENT_ADDED = 'comment_added',
}

@Entity('transfer_timeline')
@Index(['transferId', 'createdAt'])
export class TransferTimeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Transfer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transferId' })
  transfer: Transfer;

  @Column()
  transferId: string;

  @Column({
    type: 'enum',
    enum: TimelineEventType,
  })
  eventType: TimelineEventType;

  @Column()
  description: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performedBy' })
  performer: User;

  @Column({ nullable: true })
  performedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  eventData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}