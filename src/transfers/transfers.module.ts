import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { Transfer } from './entities/transfer.entity';
import { TransferTimeline } from './entities/transfer-timeline.entity';
import { LearnersModule } from '@learners/learners.module';
import { InstitutionsModule } from '@institutions/institutions.module';
import { AuditModule } from '@audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transfer, TransferTimeline]),
    LearnersModule,
    InstitutionsModule,
    AuditModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}