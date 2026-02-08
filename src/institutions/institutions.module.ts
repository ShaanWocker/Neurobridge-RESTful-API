import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionsService } from './institutions.service';
import { InstitutionsController } from './institutions.controller';
import { Institution } from './entities/institution.entity';
import { AuditModule } from '@audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Institution]), AuditModule],
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}