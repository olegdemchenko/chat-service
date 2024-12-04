import { BadRequestException } from '@nestjs/common';
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
import { ChatEvents } from '../constants';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { UsersProvider } from './users.provider';

@WebSocketGateway(5000, {
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
  ) {}

  async handleConnection(client: Socket) {
    const userToken = client.handshake.auth.token as string;
    try {
      const userExternalInfo = await this.usersProvider.fetchUserExternalInfo(
        userToken,
      );
      let user = await this.usersService.findByExternalId(userExternalInfo.id);
      if (!user) {
        user = await this.usersService.create({
          name: userExternalInfo.name,
          externalId: userExternalInfo.id,
        });
      }
      await this.usersProvider.saveUserConnection(user.id, client.id);
    } catch (e) {
      if (e instanceof BadRequestException) {
        client.emit(ChatEvents.customError, new Error('User token is invalid'));
        return;
      }
      throw e;
    }
  }

  @SubscribeMessage(ChatEvents.findUsers)
  async handleFindUsers(
    @MessageBody('userId') userId: User['userId'],
    @MessageBody('query') query: string,
    @MessageBody('page') page: number,
  ) {
    return await this.usersService.findUsers(userId, query, page);
  }

  @SubscribeMessage(ChatEvents.isUserOnline)
  async handleIsUserOnline(@MessageBody('userId') userId: User['userId']) {
    const isUserOnline = await this.usersService.isUserOnline(userId);
    return isUserOnline;
  }

  async handleDisconnect(client: Socket) {
    await this.usersProvider.removeUserConnection(client.id);
  }
}
