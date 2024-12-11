import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesModule } from 'src/messages/messages.module';
import { UsersModule } from '../users/users.module';
import { RoomsGateway } from './rooms.gateway';
import { RoomsProvider } from './rooms.provider';
import { RoomsService } from './rooms.service';
import { RoomSchema } from './schemas/room.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Room', schema: RoomSchema }]),
    forwardRef(() => UsersModule),
    forwardRef(() => MessagesModule),
  ],
  providers: [RoomsService, RoomsProvider, RoomsGateway],
  exports: [RoomsProvider, RoomsService],
})
export class RoomsModule {}
