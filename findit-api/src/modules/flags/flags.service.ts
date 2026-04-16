import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import {
  FlagTargetType,
  ReportFlag,
} from './report-flag.entity';
import { CreateFlagDto } from './dto/create-flag.dto';
import { Report } from '../reports/report.entity';
import { User } from '../users/user.entity';
import { Message } from '../messages/message.entity';

@Injectable()
export class FlagsService {
  constructor(
    @InjectRepository(ReportFlag)
    private readonly reportFlagsRepository: Repository<ReportFlag>,
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(flaggerId: string, dto: CreateFlagDto) {
    const targetOwnerId = await this.getTargetOwnerId(dto.target_type, dto.target_id);

    if (targetOwnerId === flaggerId) {
      throw new BadRequestException({ code: 'CANNOT_FLAG_YOURSELF' });
    }

    const existing = await this.reportFlagsRepository.findOne({
      where: {
        flagger_id: flaggerId,
        target_type: dto.target_type,
        target_id: dto.target_id,
      },
    });

    if (existing) {
      throw new ConflictException({ code: 'ALREADY_FLAGGED' });
    }

    const flagToCreate = this.reportFlagsRepository.create();
    flagToCreate.flagger_id = flaggerId;
    flagToCreate.target_type = dto.target_type;
    flagToCreate.target_id = dto.target_id;
    flagToCreate.motif = dto.motif;
    flagToCreate.description = dto.description ?? null;

    const flag = await this.reportFlagsRepository.save(flagToCreate);

    await this.applyAutoModeration(dto.target_type, dto.target_id);

    return {
      id: flag.id,
      message: 'Flag created',
    };
  }

  private async applyAutoModeration(
    targetType: FlagTargetType,
    targetId: string,
  ): Promise<void> {
    const count = await this.reportFlagsRepository.count({
      where: { target_type: targetType, target_id: targetId },
    });

    if (targetType === FlagTargetType.REPORT && count >= 3) {
      await this.reportsRepository.update({ id: targetId }, { is_visible: false });
      this.eventEmitter.emit('report.auto_hidden', { reportId: targetId, flags: count });
      return;
    }

    if (targetType === FlagTargetType.USER && count >= 5) {
      await this.usersRepository.update({ id: targetId }, { is_suspended: true });
      this.eventEmitter.emit('user.auto_suspended', { userId: targetId, flags: count });
    }
  }

  private async getTargetOwnerId(
    targetType: FlagTargetType,
    targetId: string,
  ): Promise<string | null> {
    if (targetType === FlagTargetType.REPORT) {
      const report = await this.reportsRepository.findOne({ where: { id: targetId } });
      if (!report) {
        throw new NotFoundException('Report not found');
      }
      return report.user_id;
    }

    if (targetType === FlagTargetType.USER) {
      const user = await this.usersRepository.findOne({ where: { id: targetId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user.id;
    }

    const message = await this.messagesRepository.findOne({ where: { id: targetId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message.sender_id;
  }
}
