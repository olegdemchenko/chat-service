import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import _ from 'lodash';
import { UserDocument } from 'src/users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

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
    try {
      await bcrypt.compare(password, user.password);
      return _.omit(user, ['password']);
    } catch (e) {
      return null;
    }
  }

  async login(user: UserDocument) {
    const payload = { username: user.name, sub: user.userId };
    return { access_token: this.jwtService.sign(payload) };
  }
}
