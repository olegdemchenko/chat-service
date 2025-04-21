import { Injectable } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { StorageService } from '../storage/storage.service';
import { Socket } from 'socket.io';

@Injectable()
export class UsersProvider {
  constructor(private storageService: StorageService) {}

  async saveUserConnection(userId: User['userId'], clientId: Socket['id']) {
    await this.storageService.add(userId, clientId);
    await this.storageService.setAdd('active_users', userId);
  }

  async removeUserConnection(userId: User['userId']) {
    await this.storageService.delete(userId);
    await this.storageService.setRemove('active_users', userId);
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
