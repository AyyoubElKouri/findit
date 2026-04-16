import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/user.entity';
import { CreateFlagDto } from './dto/create-flag.dto';
import { FlagsService } from './flags.service';

interface JwtRequest extends Request {
  user: User;
}

@Controller('flags')
@UseGuards(JwtAuthGuard)
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  @Post()
  create(@Req() req: JwtRequest, @Body() dto: CreateFlagDto) {
    return this.flagsService.create(req.user.id, dto);
  }
}
