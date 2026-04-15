import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { AccessTokenPayload } from '../auth.types';

interface WsClient {
  handshake: {
    auth?: { token?: unknown };
    headers: { authorization?: unknown };
  };
  data: { user?: User };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<WsClient>();
    const token = this.extractToken(client);

    if (!token) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED' });
    }

    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    if (!accessSecret) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED' });
    }

    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
      token,
      {
        secret: accessSecret,
      },
    );

    if (payload.type !== 'access' || !payload.sub) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED' });
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED' });
    }

    client.data.user = user;
    return true;
  }

  private extractToken(client: WsClient): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader !== 'string') {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }
}
