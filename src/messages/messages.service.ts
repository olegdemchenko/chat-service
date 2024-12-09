import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { NewMessageDto } from './dto/new-message.dto';
import { Message } from './schemas/message.schema';
import { UpdateMessageDto } from './dto/update-message.dto';
import { RoomsService } from '../rooms/rooms.service';
import * as _ from 'lodash';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel('Message') private messageModel: Model<Message>,
    private roomService: RoomsService,
  ) {}

  async addNewMessage({ roomId, text, author }: NewMessageDto) {
    const newMessage = new this.messageModel({
      text,
      author,
      readBy: [author],
    });
    await newMessage.save();
    await this.roomService.saveMessageToRoom(roomId, newMessage.messageId);
    return _.pick(newMessage, [
      'messageId',
      'author',
      'text',
      'readBy',
      'createdAt',
      'updatedAt',
    ]);
  }

  async updateMessage({ messageId, newText }: UpdateMessageDto) {
    const updatedMessage = await this.messageModel.findOneAndUpdate(
      { messageId },
      { text: newText },
      { new: true },
    );
    return _.pick(updatedMessage, [
      'messageId',
      'author',
      'text',
      'readBy',
      'createdAt',
      'updatedAt',
    ]);
  }

  async deleteMessage(messageId: Message['messageId']) {
    return await this.messageModel.deleteOne({ messageId });
  }

  async markMessagesAsRead(
    messagesIds: Message['messageId'][],
    userId: User['userId'],
  ) {
    return await this.messageModel.updateMany(
      { messageId: { $in: messagesIds } },
      { $push: { readBy: userId } },
    );
  }
}
