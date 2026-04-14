import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Report } from '../reports/report.entity';
import { User } from '../users/user.entity';

export enum ConversationStatut {
  EN_ATTENTE = 'en_attente',
  ACTIVE = 'active',
  REFUSEE = 'refusee',
  ARCHIVEE = 'archivee',
  LECTURE_SEULE = 'lecture_seule',
}

@Entity('conversations')
@Unique(['report_lost_id', 'report_found_id'])
export class Conversation {
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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'initiator_id' })
  initiator: User;

  @Column({ name: 'initiator_id' })
  initiator_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({ name: 'receiver_id' })
  receiver_id: string;

  @Column({
    type: 'enum',
    enum: ConversationStatut,
    default: ConversationStatut.EN_ATTENTE,
  })
  statut: ConversationStatut;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;
}
