import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { User } from './schemas/user.schema';
import { StorageService } from '../storage/storage.service';
import { Socket } from 'socket.io';

type ExternalUserInfo = {
  id: number;
  name: string;
  email: string | null;
};

@Injectable()
export class UsersProvider {
  constructor(
    private storageService: StorageService,
    private configService: ConfigService,
  ) {}

  async fetchUserExternalInfo(userToken: string) {
    try {
      const { data: userInfo } = await axios.get<ExternalUserInfo>(
        this.configService.get<string>('AUTH_SERVICE_URL'),
        {
          headers: {
            Authorization: `Bearer ${userToken as string}`,
          },
        },
      );
      return userInfo;
    } catch (e) {
      if (e instanceof AxiosError && e.response?.status === 400) {
        throw new BadRequestException();
      }
      throw e;
    }
  }

  async saveUserConnection(userId: User['userId'], clientId: Socket['id']) {
    await this.storageService.add(clientId, userId);
    await this.storageService.add(userId, clientId);
    await this.storageService.setAdd('active_users', userId);
  }

  async removeUserConnection(clientId: Socket['id']) {
    const userId = await this.storageService.get(clientId);
    await this.storageService.delete(clientId);
    await this.storageService.delete(userId);
    await this.storageService.setRemove('active_users', userId);
  }

  async getUserId(clientId: Socket['id']) {
    return await this.storageService.get(clientId);
  }

  async isUserOnline(userId: User['userId']) {
    return Boolean(
      await this.storageService.setIsMember('active_users', userId),
    );
  }

  async getUserSocketId(userId: User['userId']) {
    return await this.storageService.get(userId);
  }
}
