import { User } from '../users/user.entity';

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export interface AppleIdentityPayload {
  sub: string;
  email?: string;
  email_verified?: 'true' | 'false' | boolean;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface SerializedAuthUser {
  id: string;
  nom: string;
  email: string;
  photo_url: string | null;
}

export interface AuthResponse extends AuthTokens {
  user: SerializedAuthUser;
}

export interface GoogleOAuthProfile {
  googleId: string;
  email: string;
  nom: string;
  photo_url: string | null;
}

export interface GoogleCallbackResult {
  redirectUrl: string;
}

export type JwtAuthenticatedUser = User;
