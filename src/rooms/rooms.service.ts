import { Model, PipelineStage } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as _ from 'lodash';
import { Room } from './interfaces/room.interface';
import { User } from '../users/schemas/user.schema';
import { MESSAGES_PER_PAGE } from '../constants';
import { RoomDocument } from './schemas/room.schema';
import { Message } from 'src/messages/interfaces/message.interface';
import { MessageDocument } from 'src/messages/schemas/message.schema';

@Injectable()
export class RoomsService {
  constructor(@InjectModel('Room') private roomModel: Model<Room>) {}

  async getRooms(searchCryteria: PipelineStage.Match, userId: User['userId']) {
    const res = await this.roomModel.aggregate([
      searchCryteria,

      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: 'userId',
          as: 'participants',
        },
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'messages',
          foreignField: 'messageId',
          as: 'messages',
        },
      },
      {
        $project: {
          roomId: 1,
          participants: {
            $filter: {
              input: '$participants',
              as: 'participant',
              cond: { $ne: ['$$participant.userId', userId] },
            },
          },
          messages: 1,
          messagesCount: {
            $size: '$messages',
          },
        },
      },
      {
        $project: {
          roomId: 1,
          participants: 1,
          messages: 1,
          messagesCount: 1,
          unreadMessagesCount: {
            $size: {
              $filter: {
                input: '$messages',
                as: 'message',
                cond: {
                  $not: [{ $in: [userId, '$$message.readBy'] }],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          roomId: 1,
          participants: 1,
          messages: {
            $slice: [
              {
                $sortArray: {
                  input: '$messages',
                  sortBy: { createdAt: -1 },
                },
              },
              0,
              MESSAGES_PER_PAGE,
            ],
          },
          messagesCount: 1,
          unreadMessagesCount: 1,
        },
      },
    ]);
    return res.map((room: RoomDocument) => {
      return {
        ..._.omit(room, ['_id']),
        participants: room.participants.map(({ userId, name }) => ({
          userId,
          name,
        })),
      };
    });
  }

  async getAllUserCommunications(userId: User['userId']) {
    return await this.getRooms(
      {
        $match: {
          activeParticipants: userId,
        },
      },
      userId,
    );
  }

  async getUserRoomsIds(userId: User['userId']) {
    return await this.roomModel.aggregate([
      {
        $match: {
          activeParticipants: userId,
        },
      },
      {
        $project: {
          roomId: 1,
        },
      },
    ]);
  }

  async getExistingRoom(
    participantsIds: User['userId'][],
    userId: User['userId'],
  ) {
    const foundRooms = await this.getRooms(
      {
        $match: {
          participants: {
            $all: participantsIds,
          },
        },
      },
      userId,
    );
    if (foundRooms.length === 0) {
      return null;
    }
    return foundRooms[0];
  }

  async addActiveParticipant(roomId: Room['roomId'], userId: User['userId']) {
    return await this.roomModel.updateOne(
      { roomId },
      {
        $push: {
          activeParticipants: userId,
        },
      },
    );
  }

  async createNewRoom(
    firstParticipantId: User['userId'],
    secondParticipantId: User['userId'],
  ) {
    const newRoom = new this.roomModel({
      participants: [firstParticipantId, secondParticipantId],
      activeParticipants: [firstParticipantId, secondParticipantId],
    });
    await newRoom.save();
    return newRoom;
  }

  async saveMessageToRoom(
    roomId: Room['roomId'],
    newMessageId: Message['messageId'],
  ) {
    return await this.roomModel.updateOne(
      { roomId },
      {
        $push: {
          messages: newMessageId,
        },
      },
    );
  }

  async deleteMessageFromRoom(
    roomId: Room['roomId'],
    messageId: Message['messageId'],
  ) {
    return await this.roomModel.updateOne(
      { roomId },
      { $pull: { messages: messageId } },
    );
  }

  async loadMoreMessages(roomId: Room['roomId'], skip: number) {
    const res = await this.roomModel.aggregate([
      {
        $match: {
          roomId,
        },
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'messages',
          foreignField: 'messageId',
          as: 'messages',
        },
      },
      {
        $project: {
          messages: {
            $slice: [
              {
                $sortArray: {
                  input: '$messages',
                  sortBy: { createdAt: -1 },
                },
              },
              skip,
              MESSAGES_PER_PAGE,
            ],
          },
        },
      },
    ]);
    const messages = res[0].messages as MessageDocument[];
    return messages.map((message) =>
      _.pick(message, [
        'messageId',
        'author',
        'text',
        'readBy',
        'createdAt',
        'updatedAt',
      ]),
    );
  }

  async getActiveParticipants(roomId: Room['roomId']) {
    const res = await this.roomModel.findOne({ roomId }, 'activeParticipants');
    return res.activeParticipants;
  }

  async deleteActiveParticipant(
    roomId: Room['roomId'],
    userId: User['userId'],
  ) {
    return await this.roomModel.updateOne(
      { roomId },
      { $pull: { activeParticipants: userId } },
    );
  }

  async deleteRoom(roomId: Room['roomId']) {
    return await this.roomModel.deleteOne({ roomId });
  }
}
