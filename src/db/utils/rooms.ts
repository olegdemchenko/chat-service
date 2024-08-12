import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import RoomModel from "../models/Room";
import { Message } from "../models/Message";
import { User } from "../models/User";

export const getRoom = async (roomId: string) => {
  const room = await RoomModel.findOne({ roomId });
  return room!;
};

export const createNewRoom = async (
  firstParticipantId: Types.ObjectId,
  secondParticipantId: Types.ObjectId,
) => {
  const newRoom = new RoomModel({
    roomId: uuidv4(),
    messages: [],
    participants: [firstParticipantId, secondParticipantId],
    activeParticipants: [firstParticipantId, secondParticipantId],
  });
  await newRoom.save();
  return newRoom;
};

export const deleteRoom = async (roomId: string) => {
  const result = await RoomModel.deleteOne({ roomId });
  return result;
};

export const removeMessage = async (
  roomId: string,
  messageId: Types.ObjectId,
) => {
  const result = await RoomModel.updateOne(
    { roomId },
    { $pull: { messages: messageId } },
  );
  return result;
};

export const getUserRooms = async (id: Types.ObjectId) => {
  const userRooms = await RoomModel.find({
    activeParticipants: { $elemMatch: { $eq: id } },
  })
    .populate<{ messages: Message[] }>({
      path: "messages",
      select: "messageId text author lastModified -_id",
    })
    .populate<{ participants: User[] }>({
      path: "participants",
      match: { _id: { $ne: id } },
      select: "userId name -_id",
    });
  return userRooms;
};

export const addActiveParticipant = async (
  roomId: string,
  participantId: Types.ObjectId,
) => {
  const result = await RoomModel.updateOne(
    { roomId },
    {
      $push: {
        activeParticipants: participantId,
      },
    },
  );
  return result;
};

export const removeActiveParticipant = async (
  roomId: string,
  participantId: Types.ObjectId,
) => {
  const result = await RoomModel.updateOne(
    { roomId },
    { $pull: { activeParticipants: participantId } },
  );
  return result;
};

export const getRoomByParticipants = async (
  firstParticipantId: Types.ObjectId,
  secondParticipantId: Types.ObjectId,
) => {
  const room = await RoomModel.findOne({
    participants: { $all: [firstParticipantId, secondParticipantId] },
  });
  return room!;
};

export const getRoomWithMessages = async (roomId: string) => {
  const roomWithMessages = await RoomModel.findOne({ roomId }).populate<{
    messages: Message[];
  }>("messages");
  return roomWithMessages!;
};
