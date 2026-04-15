import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
}

@Entity('users')
@Index(['is_active'])
@Index(['is_suspended'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password_hash: string | null;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.EMAIL })
  provider: AuthProvider;

  @Column({ type: 'varchar', nullable: true })
  provider_id: string | null;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'varchar', nullable: true })
  photo_url: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  note_fiabilite: number | null;

  @CreateDateColumn()
  date_inscription: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_suspended: boolean;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', nullable: true })
  push_token: string | null;

  @Column({ type: 'int', default: 0 })
  reports_count: number;
}
