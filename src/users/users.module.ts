import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersGateway } from './users.gateway';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '..//storage/storage.module';
import { UsersProvider } from './users.provider';
import { RoomsModule } from 'src/rooms/rooms.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    ConfigModule,
    StorageModule,
    forwardRef(() => RoomsModule),
  ],
  providers: [UsersService, UsersProvider, UsersGateway],
  exports: [UsersService, UsersProvider],
})
export class UsersModule {}
