import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from './email-verification.entity';
import { PasswordReset } from './password-reset.entity';
import { RefreshToken } from './refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerification, PasswordReset, RefreshToken]),
  ],
  exports: [TypeOrmModule],
})
export class AuthModule {}
