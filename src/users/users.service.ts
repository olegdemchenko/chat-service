import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { Room } from '../rooms/interfaces/room.interface';
import { USERS_PER_PAGE } from '../constants';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto) {
    const createdUser = await this.userModel.create(createUserDto);
    return createdUser;
  }

  async findByExternalId(id: number) {
    return this.userModel.findOne({ externalId: id }).exec();
  }

  async getUserName(userId: User['userId']) {
    return await this.userModel.findOne({ userId }, 'name');
  }

  async addRoom(userId: User['userId'], roomId: Room['roomId']) {
    return await this.userModel.updateOne(
      {
        _id: userId,
      },
      { $push: { rooms: roomId } },
    );
  }

  async deleteRoom(userId: User['userId'], roomId: Room['roomId']) {
    return await this.userModel.updateOne(
      { userId },
      { $pull: { rooms: roomId } },
    );
  }

  async findUsers(userId: User['userId'], query: string, page: number) {
    const searchCriteria = {
      name: { $regex: new RegExp(query, 'i') },
      userId: { $ne: userId },
    };
    const foundUsers = await this.userModel.find(
      searchCriteria,
      'userId name',
      {
        skip: page * USERS_PER_PAGE,
        limit: USERS_PER_PAGE,
      },
    );
    const usersCount = await this.userModel.countDocuments(searchCriteria);
    return [foundUsers, usersCount] as const;
  }
}
