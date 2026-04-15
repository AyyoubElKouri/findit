import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { GoogleCallbackResult, GoogleOAuthProfile } from '../auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth configuration is missing');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GoogleCallbackResult> {
    const email = profile.emails?.[0]?.value?.toLowerCase().trim();
    const googleId = profile.id;

    if (!email || !googleId) {
      throw new Error('Invalid Google profile payload');
    }

    const oauthProfile: GoogleOAuthProfile = {
      googleId,
      email,
      nom: profile.displayName?.trim() || 'Utilisateur Google',
      photo_url: profile.photos?.[0]?.value ?? null,
    };

    return this.authService.handleGoogleCallback(oauthProfile);
  }
}
