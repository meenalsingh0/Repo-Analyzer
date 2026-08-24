import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { GithubAuthGuard, JwtAuthGuard } from './guards';

const COOKIE = 'token';

@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // Step 1: redirects the browser to GitHub's consent screen
  @Get('auth/github')
  @UseGuards(GithubAuthGuard)
  login() {}

  // Step 2: GitHub redirects back here; strategy has upserted the user
  @Get('auth/github/callback')
  @UseGuards(GithubAuthGuard)
  callback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    res.cookie(COOKIE, this.auth.signToken(user.id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT expiry
    });
    res.redirect(this.config.get('FRONTEND_URL', 'http://localhost:3001'));
  }

  @Post('auth/logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE);
    return { loggedOut: true };
  }

  // GET /me — profile of the logged-in user
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    const { id, username, avatarUrl } = req.user as User;
    return { id, username, avatarUrl };
  }
}
