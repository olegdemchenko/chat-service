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

  async getUserById(userId: string) {
    return this.userModel.findOne({ userId }).exec();
  }

  async getUserByName(username: string) {
    return this.userModel.findOne({ name: username }).exec();
  }

  async getUserName(userId: User['userId']) {
    const { name } = await this.userModel.findOne({ userId }, 'name -_id');
    return name;
  }

  async isUsernameTaken(username: string) {
    const user = await this.userModel.findOne({ name: username }).exec();
    return Boolean(user);
  }

  async isEmailTaken(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    return Boolean(user);
  }

  async addRoom(userId: User['userId'], roomId: Room['roomId']) {
    return await this.userModel.updateOne(
      {
        userId,
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
