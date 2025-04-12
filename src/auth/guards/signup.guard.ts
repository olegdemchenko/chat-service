import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthService } from '../auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { hashPassword } from 'src/utils';

@Injectable()
export class SignUpGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const newUserDto = request.body as CreateUserDto;
    const areUserCredentialsValid =
      await this.authService.validateNewUserCredentials(
        newUserDto.username,
        newUserDto.email,
      );
    if (!areUserCredentialsValid) {
      throw new ConflictException();
    }
    const hashedPassword = await hashPassword(newUserDto.password);
    const user = await this.usersService.create({
      ...newUserDto,
      password: hashedPassword,
    });
    request['user'] = user;
    return true;
  }
}
