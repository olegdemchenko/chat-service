import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
import { User } from '../users/schemas/user.schema';
import { getRoomName } from '../utils';
import { ChatEvents } from '../constants';
import { StorageService } from '../storage/storage.service';
import _ from 'lodash';
import { Room } from './interfaces/room.interface';
import { UsersService } from '../users/users.service';

@WebSocketGateway(5000, {
  cors: {
    origin: '*',
  },
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private storageService: StorageService,
    private usersService: UsersService,
    private roomsService: RoomsService,
  ) {}

  async getRoomsNames(userId: Socket['id']) {
    const userRoomsIds = await this.roomsService.getUserRoomsIds(userId);
    return userRoomsIds.map(({ roomId }) => getRoomName(roomId));
  }

  @SubscribeMessage(ChatEvents.getUserId)
  async handleGetUserId(@ConnectedSocket() client: Socket) {
    return await this.storageService.get(client.id);
  }

  @SubscribeMessage(ChatEvents.getUserRooms)
  async handleGetUserRooms(@MessageBody() userId: User['userId']) {
    return await this.roomsService.getAllUserCommunications(userId);
  }

  @SubscribeMessage(ChatEvents.userOnline)
  async handleUserOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: User['userId'],
  ) {
    const roomsNames = await this.getRoomsNames(userId);
    await client.join(roomsNames);
    client.to(roomsNames).emit(ChatEvents.userJoin, userId);
  }

  @SubscribeMessage(ChatEvents.userOffline)
  async handleUserOffline(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: User['userId'],
  ) {
    const roomsNames = await this.getRoomsNames(userId);
    client.to(roomsNames).emit(ChatEvents.userLeave, userId);
    roomsNames.forEach((room) => client.leave(room));
  }

  @SubscribeMessage(ChatEvents.findRoom)
  async handleFindRoom(@MessageBody() usersIds: User['userId'][]) {
    const existingRoom = await this.roomsService.getRoomWithUsers(usersIds);
    if (!existingRoom) {
      return null;
    }
    return _.omit(existingRoom, ['activeParticipants']);
  }

  @SubscribeMessage(ChatEvents.connectToRoom)
  async handleConnectToRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: Room['roomId'],
    @MessageBody('userId') userId: User['userId'],
  ) {
    await this.roomsService.addActiveParticipant(roomId, userId);
    await this.usersService.joinRoom(userId, roomId);

    //TODO send notification about joining room after Messages module is ready
    await client.join(getRoomName(roomId));
  }

  @SubscribeMessage(ChatEvents.createRoom)
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('firstParticipantId') firstParticipantId: User['userId'],
    @MessageBody('secondParticipantId') secondParticipantId: User['userId'],
  ) {
    const newRoom = await this.roomsService.createNewRoom(
      firstParticipantId,
      secondParticipantId,
    );
    await this.usersService.joinRoom(firstParticipantId, newRoom.roomId);
    await this.usersService.joinRoom(secondParticipantId, newRoom.roomId);
    await client.join(getRoomName(newRoom.roomId));
    const isSecondParticipantOnline = await this.storageService.setIsMember(
      'active_users',
      secondParticipantId,
    );
    const defaultRoomPayload = {
      roomId: newRoom.roomId,
      participants: [],
      messages: [],
      messagesCount: 0,
      unreadMessagesCount: 0,
    };
    if (isSecondParticipantOnline) {
      const secondParticipantSocketId = await this.storageService.get(
        secondParticipantId,
      );
      const secondParticipantSocket = this.server
        .of('/')
        .sockets.get(secondParticipantSocketId);
      const firstParticipantName = await this.usersService.getUserName(
        firstParticipantId,
      );
      secondParticipantSocket.emit(ChatEvents.newRoom, {
        ...defaultRoomPayload,
        participants: [
          { userId: firstParticipantId, name: firstParticipantName },
        ],
      });
    }
    const secondParticipantName = await this.usersService.getUserName(
      secondParticipantId,
    );
    return {
      ...defaultRoomPayload,
      participants: [
        { userId: secondParticipantId, name: secondParticipantName },
      ],
    };
  }

  @SubscribeMessage(ChatEvents.loadMoreMessages)
  async handleLoadMoreMessages(
    @MessageBody('roomId') roomId: Room['roomId'],
    @MessageBody('skip') skip: number,
  ) {
    const messages = await this.roomsService.loadMoreMessages(roomId, skip);
    return messages;
  }

  @SubscribeMessage(ChatEvents.leaveRoom)
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: Room['roomId'],
    @MessageBody('userId') userId: User['userId'],
  ) {
    await this.usersService.leaveRoom(userId, roomId);
    const activeParticipants = await this.roomsService.getActiveParticipants(
      roomId,
    );

    //TODO test and fix the condition below
    if (activeParticipants.activeParticipants.length === 1) {
      await this.roomsService.deleteRoom(roomId);
    } else {
      await this.roomsService.deleteActiveParticipant(roomId, userId);
      // TODO add sending a messages
    }
    await client.leave(getRoomName(roomId));
    return true;
  }
}
