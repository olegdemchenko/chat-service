import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Room } from './interfaces/room.interface';
import { User } from '../users/schemas/user.schema';
import { MESSAGES_PER_PAGE } from '../constants';

@Injectable()
export class RoomsService {
  constructor(@InjectModel('Room') private roomModel: Model<Room>) {}

  async getAllUserCommunications(userId: User['userId']) {
    return await this.roomModel.aggregate([
      {
        $match: {
          activeParticipants: userId,
        },
      },
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
          foreignField: 'userId',
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

  async getRoomWithUsers(usersIds: User['userId'][]) {
    return await this.roomModel.findOne({
      participants: { $all: usersIds },
    });
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

  async loadMoreMessages(roomId: Room['roomId'], skip: number) {
    return await this.roomModel.aggregate([
      {
        $match: {
          roomId,
        },
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'messages',
          foreignField: '_id',
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
  }

  async getActiveParticipants(roomId: Room['roomId']) {
    return await this.roomModel.findOne({ roomId }, 'activeParticipants');
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