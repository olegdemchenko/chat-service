import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersGateway } from './users.gateway';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '..//storage/storage.module';
import { UsersProvider } from './users.provider';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    ConfigModule,
    StorageModule,
  ],
  providers: [UsersService, UsersProvider, UsersGateway],
  exports: [UsersService],
})
export class UsersModule {}
