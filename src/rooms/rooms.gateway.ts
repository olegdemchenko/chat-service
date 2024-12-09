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
import _ from 'lodash';
import { Room } from './interfaces/room.interface';
import { UsersService } from '../users/users.service';
import { UsersProvider } from 'src/users/users.provider';
import { MessagesService } from 'src/messages/messages.service';

@WebSocketGateway(5000, {
  cors: {
    origin: '*',
  },
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private usersService: UsersService,
    private usersProvider: UsersProvider,
    private roomsService: RoomsService,
    private messagesService: MessagesService,
  ) {}

  @SubscribeMessage(ChatEvents.getUserRooms)
  async handleGetUserRooms(@ConnectedSocket() client: Socket) {
    const userId = await this.usersProvider.getUserId(client.id);
    const rooms = await this.roomsService.getAllUserCommunications(userId);
    const roomsWithUsersStatuses = await Promise.all(
      rooms.map(async (room) => ({
        ...room,
        participants: await Promise.all(
          room.participants.map(async (participant) => ({
            ...participant,
            isOnline: await this.usersProvider.isUserOnline(participant.userId),
          })),
        ),
      })),
    );
    return roomsWithUsersStatuses;
  }

  @SubscribeMessage(ChatEvents.findRoom)
  async handleFindRoom(@MessageBody() usersIds: User['userId'][]) {
    const existingRoom = await this.roomsService.getRoomWithUsers(usersIds);
    if (!existingRoom) {
      return 'none';
    }
    return _.omit(existingRoom, ['activeParticipants']);
  }

  @SubscribeMessage(ChatEvents.connectToRoom)
  async handleConnectToRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: Room['roomId'],
    @MessageBody('userId') userId: User['userId'],
    @MessageBody('userName') userName: User['name'],
  ) {
    await this.roomsService.addActiveParticipant(roomId, userId);
    await this.usersService.addRoom(userId, roomId);

    await client.join(getRoomName(roomId));
    const notification = await this.messagesService.addNewMessage({
      roomId,
      text: `User "${userName}" joined the conversation`,
      author: 'system',
    });
    this.server
      .to(getRoomName(roomId))
      .emit(ChatEvents.newMessage, roomId, notification);
  }

  @SubscribeMessage(ChatEvents.createRoom)
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() participantsIds: User['userId'][],
  ) {
    const [firstParticipantId, secondParticipantId] = participantsIds;
    const newRoom = await this.roomsService.createNewRoom(
      firstParticipantId,
      secondParticipantId,
    );
    await this.usersService.addRoom(firstParticipantId, newRoom.roomId);
    await this.usersService.addRoom(secondParticipantId, newRoom.roomId);
    await client.join(getRoomName(newRoom.roomId));
    const isSecondParticipantOnline = await this.usersProvider.isUserOnline(
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
      const secondParticipantSocketId =
        await this.usersProvider.getUserSocketId(secondParticipantId);
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

  @SubscribeMessage(ChatEvents.deleteRoom)
  async handleDeleteRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: Room['roomId'],
    @MessageBody('userId') userId: User['userId'],
    @MessageBody('userName') userName: User['name'],
  ) {
    await this.usersService.deleteRoom(userId, roomId);
    const activeParticipants = await this.roomsService.getActiveParticipants(
      roomId,
    );
    if (activeParticipants.length === 1) {
      await this.roomsService.deleteRoom(roomId);
    } else {
      await this.roomsService.deleteActiveParticipant(roomId, userId);
      const notification = await this.messagesService.addNewMessage({
        roomId,
        text: `User "${userName}" left the conversation`,
        author: 'system',
      });
      this.server
        .to(getRoomName(roomId))
        .emit(ChatEvents.newMessage, roomId, notification);
    }
    await client.leave(getRoomName(roomId));
    return true;
  }
}
