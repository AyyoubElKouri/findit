import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportFlag } from './report-flag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportFlag])],
  exports: [TypeOrmModule],
})
export class FlagsModule {}
