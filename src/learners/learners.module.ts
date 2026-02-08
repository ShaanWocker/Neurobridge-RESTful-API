import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearnersService } from './learners.service';
import { LearnersController } from './learners.controller';
import { Learner } from './entities/learner.entity';
import { CaseNote } from './entities/case-note.entity';
import { AuditModule } from '@audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Learner, CaseNote]), AuditModule],
  controllers: [LearnersController],
  providers: [LearnersService],
  exports: [LearnersService],
})
export class LearnersModule {}