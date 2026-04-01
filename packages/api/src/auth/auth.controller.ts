import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private jwt: JwtService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { password: string }) {
    const storedHash = process.env.ADMIN_PASSWORD_HASH;

    if (!storedHash) {
      // If no password is configured, auth is disabled — open access
      return { token: this.jwt.sign({ sub: 'admin' }) };
    }

    const valid = await bcrypt.compare(body.password, storedHash);
    if (!valid) throw new UnauthorizedException('Invalid password');

    return { token: this.jwt.sign({ sub: 'admin' }) };
  }

  @Post('verify')
  async verify() {
    // If this endpoint is reached (past the guard), token is valid
    return { valid: true };
  }
}
