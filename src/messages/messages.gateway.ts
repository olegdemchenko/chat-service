import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatEvents } from '../constants';
import { NewMessageDto } from './dto/new-message.dto';
import { MessagesService } from './messages.service';
import { getRoomName } from '../utils';
import { Message } from './interfaces/message.interface';
import { User } from 'src/users/schemas/user.schema';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Room } from '../rooms/interfaces/room.interface';
import { RoomsService } from 'src/rooms/rooms.service';

@WebSocketGateway(5000, {
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private messagesService: MessagesService,
    private roomsService: RoomsService,
  ) {}

  @SubscribeMessage(ChatEvents.newMessage)
  async handleNewMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() newMessageDto: NewMessageDto,
  ) {
    const newMessage = await this.messagesService.addNewMessage(newMessageDto);
    client
      .to(getRoomName(newMessageDto.roomId))
      .emit(ChatEvents.newMessage, newMessageDto.roomId, newMessage);
    return newMessage;
  }

  @SubscribeMessage(ChatEvents.updateMessage)
  async handleUpdateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() updateMessageDto: UpdateMessageDto,
  ) {
    const updatedMessage = await this.messagesService.updateMessage(
      updateMessageDto,
    );
    client
      .to(getRoomName(updateMessageDto.roomId))
      .emit(ChatEvents.updateMessage, updateMessageDto.roomId, updatedMessage);
    return updatedMessage;
  }

  @SubscribeMessage(ChatEvents.deleteMessage)
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: Room['roomId'],
    @MessageBody('messageId') messageId: Message['messageId'],
  ) {
    await this.messagesService.deleteMessage(messageId);
    await this.roomsService.deleteMessageFromRoom(roomId, messageId);
    client
      .to(getRoomName(roomId))
      .emit(ChatEvents.deleteMessage, roomId, messageId);
    return true;
  }

  @SubscribeMessage(ChatEvents.readMessages)
  async handleReadMessages(
    @MessageBody('messagesIds') messagesIds: Message['messageId'][],
    @MessageBody('userId') userId: User['userId'],
  ) {
    await this.messagesService.markMessagesAsRead(messagesIds, userId);
  }
}
