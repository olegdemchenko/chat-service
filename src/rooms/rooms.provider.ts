import { Injectable } from '@nestjs/common';
import { User } from '../users/schemas/user.schema';
import { getRoomName } from '../utils';
import { RoomsService } from './rooms.service';

@Injectable()
export class RoomsProvider {
  constructor(private roomsService: RoomsService) {}

  async getUserRoomsNames(userId: User['userId']) {
    const userRoomsIds = await this.roomsService.getUserRoomsIds(userId);
    return userRoomsIds.map(({ roomId }) => getRoomName(roomId));
  }
}
