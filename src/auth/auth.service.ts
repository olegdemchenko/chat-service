import { Injectable } from '@nestjs/common';
import { UserDocument } from 'src/users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { verifyPassword } from 'src/utils';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateNewUserCredentials(username: string, email: string) {
    const isUsernameTaken = await this.usersService.isUsernameTaken(username);
    const isEmailTaken = await this.usersService.isEmailTaken(email);
    if (isEmailTaken || isUsernameTaken) {
      return null;
    }
    return true;
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.getUserByName(username);
    if (!user) {
      return null;
    }
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    return user;
  }

  async login(user: UserDocument) {
    const payload = { username: user.username, sub: user.userId };
    return { access_token: this.jwtService.sign(payload) };
  }
}
