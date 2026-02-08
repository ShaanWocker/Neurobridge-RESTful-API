import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './entities/message.entity';
import { MessageDraft } from './entities/message-draft.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
import { AuditModule } from '@audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageDraft, MessageAttachment]),
    AuditModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}