import {
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets/interfaces';
import { SubscribeMessage } from '@nestjs/websockets/decorators';
import { RoomsProvider } from '../rooms/rooms.provider';
import { ChatEvents } from '../constants';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { UsersProvider } from './users.provider';

@WebSocketGateway(Number(process.env.WS_PORT), {
  cors: {
    origin: '*',
  },
})
export class UsersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private usersService: UsersService,
    private usersProvider: UsersProvider,
    private roomsProvider: RoomsProvider,
  ) {}

  async handleConnection(client: Socket) {
    const { userId } = client.handshake.auth;
    await this.usersProvider.saveUserConnection(userId, client.id);
    const userRoomsNames = await this.roomsProvider.getUserRoomsNames(userId);
    client.join(userRoomsNames);
    client.to(userRoomsNames).emit(ChatEvents.userOnline, userId);
  }

  @SubscribeMessage(ChatEvents.findUsers)
  async handleFindUsers(
    @MessageBody('userId') userId: User['userId'],
    @MessageBody('query') query: string,
    @MessageBody('page') page: number,
  ) {
    const [users, count] = await this.usersService.findUsers(
      userId,
      query,
      page,
    );
    const usersWithStatuses = await Promise.all(
      users.map(async ({ userId, username: name }) => ({
        userId,
        name,
        isOnline: await this.usersProvider.isUserOnline(userId),
      })),
    );
    return [usersWithStatuses, count];
  }

  @SubscribeMessage(ChatEvents.isUserOnline)
  async handleIsUserOnline(@MessageBody('userId') userId: User['userId']) {
    const isUserOnline = await this.usersProvider.isUserOnline(userId);
    return isUserOnline;
  }

  async handleDisconnect(client: Socket) {
    const { userId } = client.handshake.auth;
    const roomsNames = await this.roomsProvider.getUserRoomsNames(userId);
    client.to(roomsNames).emit(ChatEvents.userOffline, userId);
    roomsNames.forEach((room) => client.leave(room));
    await this.usersProvider.removeUserConnection(client.id);
  }
}
