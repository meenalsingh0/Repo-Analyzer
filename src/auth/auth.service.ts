import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface GithubProfile {
  id: string;
  username: string;
  photos?: { value: string }[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // Called by the GitHub strategy on every login
  async upsertFromGithub(profile: GithubProfile) {
    return this.prisma.user.upsert({
      where: { githubId: profile.id },
      update: { username: profile.username, avatarUrl: profile.photos?.[0]?.value },
      create: {
        githubId: profile.id,
        username: profile.username,
        avatarUrl: profile.photos?.[0]?.value,
      },
    });
  }

  signToken(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }
}
