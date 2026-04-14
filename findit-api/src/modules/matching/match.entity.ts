import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Report } from '../reports/report.entity';

@Entity('matches')
@Unique(['report_lost_id', 'report_found_id'])
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Report)
  @JoinColumn({ name: 'report_lost_id' })
  reportLost: Report;

  @Column({ name: 'report_lost_id' })
  report_lost_id: string;

  @ManyToOne(() => Report)
  @JoinColumn({ name: 'report_found_id' })
  reportFound: Report;

  @Column({ name: 'report_found_id' })
  report_found_id: string;

  @Column({ type: 'decimal', precision: 4, scale: 3 })
  score: number;

  @Column({ type: 'boolean', default: false })
  notified: boolean;

  @CreateDateColumn()
  created_at: Date;
}
