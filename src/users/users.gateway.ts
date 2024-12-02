import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets/interfaces';
import axios, { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { ExternalUserInfo } from '../types';
import { ChatEvents } from '../constants';
import { UsersService } from './users.service';
import { StorageService } from '../storage/storage.service';

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
    private configService: ConfigService,
    private storageService: StorageService,
  ) {}

  async handleConnection(client: Socket) {
    const userToken = client.handshake.auth.token as string;
    try {
      const { data: userInfo } = await axios.get<ExternalUserInfo>(
        this.configService.get<string>('AUTH_SERVICE_URL'),
        {
          headers: {
            Authorization: `Bearer ${userToken as string}`,
          },
        },
      );
      let userData = await this.usersService.findByExternalId(userInfo.id);
      if (!userData) {
        userData = await this.usersService.create({
          name: userInfo.name,
          externalId: userInfo.id,
        });
      }
      await this.storageService.add(client.id, userData.userId);
      await this.storageService.setAdd('active_users', userData.userId);
    } catch (e) {
      if (e instanceof AxiosError && e.response?.status === 400) {
        client.emit(ChatEvents.customError, new Error('User token is invalid'));
        return;
      }
      throw e;
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.storageService.get(client.id);
    await this.storageService.delete(client.id);
    await this.storageService.setRemove('active_users', userId);
  }
}
