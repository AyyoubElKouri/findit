import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { Report } from '../reports/report.entity';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Report, User, Review])],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [TypeOrmModule, MatchingService],
})
export class MatchingModule {}
