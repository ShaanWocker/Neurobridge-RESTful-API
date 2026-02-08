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

export enum SearchScope {
  INSTITUTIONS = 'institutions',
  LEARNERS = 'learners',
  TRANSFERS = 'transfers',
  MESSAGES = 'messages',
  ALL = 'all',
}

@Entity('saved_searches')
@Index(['userId', 'createdAt'])
export class SavedSearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  institutionId: string;

  @Column({
    type: 'enum',
    enum: SearchScope,
  })
  scope: SearchScope;

  @Column({ type: 'jsonb' })
  filters: Record<string, any>;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: false })
  isShared: boolean;

  @Column({ type: 'jsonb', default: [] })
  sharedWith: string[];

  @Column({ default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}