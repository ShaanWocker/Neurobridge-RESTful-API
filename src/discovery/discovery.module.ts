import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './discovery.controller';
import { SavedSearch } from './entities/saved-search.entity';
import { InstitutionsModule } from '@institutions/institutions.module';
import { LearnersModule } from '@learners/learners.module';
import { TransfersModule } from '@transfers/transfers.module';
import { MessagesModule } from '@messages/messages.module';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedSearch]),
    InstitutionsModule,
    LearnersModule,
    TransfersModule,
    MessagesModule,
    UsersModule,
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}