import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum FlagTargetType {
  REPORT = 'report',
  USER = 'user',
  MESSAGE = 'message',
}

export enum FlagMotif {
  FAUX_SIGNALEMENT = 'faux_signalement',
  CONTENU_INAPPROPRIE = 'contenu_inapproprie',
  ARNAQUE = 'arnaque',
  AUTRE = 'autre',
}

@Entity('report_flags')
@Unique(['flagger_id', 'target_type', 'target_id'])
export class ReportFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'flagger_id' })
  flagger: User;

  @Column({ name: 'flagger_id' })
  flagger_id: string;

  @Column({ type: 'enum', enum: FlagTargetType })
  target_type: FlagTargetType;

  @Column({ type: 'uuid' })
  target_id: string;

  @Column({ type: 'enum', enum: FlagMotif, nullable: true })
  motif: FlagMotif | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  description: string | null;

  @CreateDateColumn()
  created_at: Date;
}
