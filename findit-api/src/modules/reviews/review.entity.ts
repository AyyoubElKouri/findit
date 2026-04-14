import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Conversation } from '../conversations/conversation.entity';

@Entity('reviews')
@Unique(['reviewer_id', 'conversation_id'])
@Check(`"note" >= 1 AND "note" <= 5`)
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewer_id' })
  reviewer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_id' })
  reviewed: User;

  @Column({ name: 'reviewed_id' })
  reviewed_id: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'conversation_id' })
  conversation_id: string;

  @Column({ type: 'smallint' })
  note: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  commentaire: string;

  @CreateDateColumn()
  created_at: Date;
}
