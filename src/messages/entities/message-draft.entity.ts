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
import { MessageCategory, MessagePriority } from './message.entity';

@Entity('message_drafts')
@Index(['createdBy', 'createdAt'])
export class MessageDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column()
  createdBy: string;

  @Column()
  fromInstitutionId: string;

  @Column()
  toInstitutionId: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
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

  @Column({ nullable: true })
  learnerId: string;

  @Column({ nullable: true })
  transferId: string;

  @Column({ nullable: true })
  replyToId: string;

  @Column({ type: 'jsonb', default: [] })
  attachmentIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}