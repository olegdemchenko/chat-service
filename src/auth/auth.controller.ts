import { Controller, Request, Post, Get, UseGuards } from '@nestjs/common';
import * as _ from 'lodash';
import { AuthService } from './auth.service';
import { SignUpGuard } from './guards/signup.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @UseGuards(SignUpGuard)
  @Post('signup')
  async signup(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  async signin(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.getUserById(req.user.userId);
    return _.pick(user, ['name', 'email', 'rooms', 'userId']);
  }
}
