import { Injectable } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { StorageService } from '../storage/storage.service';
import { Socket } from 'socket.io';

@Injectable()
export class UsersProvider {
  constructor(private storageService: StorageService) {}

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
