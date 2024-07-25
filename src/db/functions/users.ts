import { Types } from "mongoose";
import UserModel from "../models/User";
import { Room } from "../models/Room";

export const addRoom = async (
  participantId: Types.ObjectId,
  roomId: Types.ObjectId,
) => {
  const result = await UserModel.updateOne(
    {
      _id: participantId,
    },
    { $push: { rooms: roomId } },
  );
  return result;
};

export const removeRoom = async (userId: string, roomId: Types.ObjectId) => {
  const result = await UserModel.updateOne(
    { userId },
    { $pull: { rooms: roomId } },
  );
  return result;
};

export const getUser = async (userId: string) => {
  const user = await UserModel.findOne({
    userId,
  });
  return user!;
};

export const getUserWithRooms = async (userId: string) => {
  const userWithRooms = await UserModel.findOne({ userId }).populate<{
    rooms: Room[];
  }>("rooms");
  return userWithRooms!;
};

export const findUsers = async (
  query: string,
  externalId: number,
  page: number,
  limit: number,
) => {
  const searchCriteria = {
    name: { $regex: new RegExp(query) },
    externalId: { $ne: externalId },
  };
  const match = await UserModel.find(searchCriteria, null, {
    skip: page * limit,
    limit,
  });
  const matchCount = await UserModel.countDocuments(searchCriteria);
  return [match, matchCount] as const;
};
