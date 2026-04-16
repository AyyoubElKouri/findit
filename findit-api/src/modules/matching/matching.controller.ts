import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/user.entity';
import { MatchingService } from './matching.service';

interface JwtRequest extends Request {
  user: User;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get(':id/matches')
  getReportMatches(@Req() req: JwtRequest, @Param('id') reportId: string) {
    return this.matchingService.getMatchesForReport(reportId, req.user.id);
  }
}
