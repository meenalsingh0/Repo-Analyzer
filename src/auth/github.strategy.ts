import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-github2';
import { AuthService, GithubProfile } from './auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService, private readonly auth: AuthService) {
    super({
      clientID: config.get('GITHUB_CLIENT_ID')!,
      clientSecret: config.get('GITHUB_CLIENT_SECRET')!,
      callbackURL: config.get('GITHUB_CALLBACK_URL', 'http://localhost:3000/auth/github/callback'),
      scope: [], // public profile only
    });
  }

  // Return value becomes req.user in the callback route
  async validate(_accessToken: string, _refreshToken: string, profile: GithubProfile) {
    return this.auth.upsertFromGithub(profile);
  }
}
