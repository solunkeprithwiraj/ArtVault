import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Public } from './public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Post('signup')
  async signup(@Body() body: { username: string; password: string }) {
    if (!body.username || body.username.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters');
    }
    if (!body.password || body.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const existing = await this.prisma.user.findUnique({
      where: { username: body.username },
    });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: { username: body.username, passwordHash, role: 'USER' },
    });

    return {
      token: this.jwt.sign({ sub: user.id, username: user.username, role: user.role }),
    };
  }

  @Public()
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { username: body.username },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return {
      token: this.jwt.sign({ sub: user.id, username: user.username, role: user.role }),
    };
  }

  @Post('verify')
  async verify() {
    return { valid: true };
  }

  @Get('me')
  async me(@Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
