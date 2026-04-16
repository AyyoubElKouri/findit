import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { FlagMotif, FlagTargetType } from '../report-flag.entity';

export class CreateFlagDto {
  @IsEnum(FlagTargetType)
  target_type: FlagTargetType;

  @IsUUID()
  target_id: string;

  @IsEnum(FlagMotif)
  motif: FlagMotif;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}
