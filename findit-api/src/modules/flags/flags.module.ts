import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportFlag } from './report-flag.entity';
import { FlagsService } from './flags.service';
import { FlagsController } from './flags.controller';
import { Report } from '../reports/report.entity';
import { User } from '../users/user.entity';
import { Message } from '../messages/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportFlag, Report, User, Message])],
  controllers: [FlagsController],
  providers: [FlagsService],
  exports: [TypeOrmModule, FlagsService],
})
export class FlagsModule {}
