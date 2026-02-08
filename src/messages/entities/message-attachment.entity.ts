import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';

export enum AttachmentType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  PDF = 'pdf',
  SPREADSHEET = 'spreadsheet',
  OTHER = 'other',
}

@Entity('message_attachments')
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Column()
  messageId: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column({
    type: 'enum',
    enum: AttachmentType,
  })
  fileType: AttachmentType;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  uploadedBy: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}