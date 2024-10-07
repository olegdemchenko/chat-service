import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import RoomModel, { Room } from "../models/Room";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { MESSAGES_PER_PAGE } from "../../constants";

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

export const addMessageToRoom = async (
  roomId: string,
  messageId: Types.ObjectId,
) => {
  const result = await RoomModel.updateOne(
    { roomId },
    {
      $push: {
        messages: messageId,
      },
    },
  );
  return result;
};

export const removeMessageFromRoom = async (
  roomId: string,
  messageId: Types.ObjectId,
) => {
  const result = await RoomModel.updateOne(
    { roomId },
    { $pull: { messages: messageId } },
  );
  return result;
};

export const getUserRooms = async (id: Types.ObjectId, userId: string) => {
  const userRooms = await RoomModel.aggregate([
    {
      $match: {
        activeParticipants: id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "participants",
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "messages",
        foreignField: "_id",
        as: "messages",
      },
    },
    {
      $project: {
        roomId: 1,
        participants: {
          $filter: {
            input: "$participants",
            as: "participant",
            cond: { $ne: ["$$participant._id", id] },
          },
        },
        messages: 1,
        messagesCount: {
          $size: "$messages",
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
              input: "$messages",
              as: "message",
              cond: {
                $not: [{ $in: [userId, "$$message.readBy"] }],
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
                input: "$messages",
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
  return userRooms as Room<Message, User>[];
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
  const roomWithMessages = await RoomModel.aggregate([
    {
      $match: {
        roomId,
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "messages",
        foreignField: "_id",
        as: "messages",
      },
    },
    {
      $project: {
        roomId: 1,
        messages: 1,
        messagesCount: {
          $size: "$messages",
        },
      },
    },
    {
      $project: {
        roomId: 1,
        messages: {
          $slice: [
            {
              $sortArray: {
                input: "$messages",
                sortBy: { createdAt: -1 },
              },
            },
            0,
            MESSAGES_PER_PAGE,
          ],
        },
        messagesCount: 1,
      },
    },
  ]);
  return roomWithMessages[0] as Room<Message, User>;
};

export const getMoreRoomMessages = async (roomId: string, skip: number) => {
  const aggregationResult = (await RoomModel.aggregate([
    {
      $match: {
        roomId,
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "messages",
        foreignField: "_id",
        as: "messages",
      },
    },
    {
      $project: {
        messages: {
          $slice: [
            {
              $sortArray: {
                input: "$messages",
                sortBy: { createdAt: -1 },
              },
            },
            skip,
            MESSAGES_PER_PAGE,
          ],
        },
      },
    },
  ])) as [{ messages: Message[] }];
  return aggregationResult[0].messages;
};
