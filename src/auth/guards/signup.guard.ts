import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthService } from '../auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class SignUpGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const newUserDto = request.data as CreateUserDto;
    const areUserCredentialsValid =
      await this.authService.validateNewUserCredentials(
        newUserDto.name,
        newUserDto.email,
      );
    if (!areUserCredentialsValid) {
      throw new BadRequestException();
    }
    const user = await this.usersService.create(newUserDto);
    request['user'] = user;
    return true;
  }
}
