import { RedisClientType } from "@redis/client";
import { v4 as uuidv4 } from "uuid";
import { Schema } from "mongoose";
import RoomModel, { Room } from "../db/models/Room";
import UserModel, { User, UserDocument } from "../db/models/User";
import MessageModel, { Message } from "../db/models/Message";
import { CustomSocket, IOServer } from "../types";
import { logErrors } from "../utils";
import sendMessage from "./messages/sendMessage";

interface RoomWithPopulatedFields {
  _id: Schema.Types.ObjectId;
  roomId: string;
  messages: Message[];
  participants: User[];
}

interface RoomWithParticipantStatus {
  roomId: string;
  messages: Message[];
  participants: (Omit<User, "externalId" | "rooms"> & {
    isOnline: boolean;
  })[];
}

const createRoomName = (roomId: string) => `room:${roomId}`;

const connectToExistingRoom = async (
  firstParticipant: UserDocument,
  secondParticipant: UserDocument,
  room: RoomWithPopulatedFields,
  socket: CustomSocket,
  redisClient: RedisClientType,
  successCallback: (newRoom: RoomWithParticipantStatus) => void,
) => {
  await RoomModel.updateOne(
    { roomId: room.roomId },
    {
      $push: {
        activeParticipants: firstParticipant._id,
      },
    },
  );
  await UserModel.updateOne(
    {
      _id: firstParticipant._id,
    },
    { $push: { rooms: room._id } },
  );
  await socket.join(createRoomName(room.roomId));
  const secondParticipantSocketId = await redisClient.get(
    secondParticipant.userId,
  );
  successCallback({
    roomId: room.roomId,
    messages: room.messages as any as Message[],
    participants: [
      {
        userId: secondParticipant.userId,
        name: secondParticipant.name,
        isOnline: Boolean(secondParticipantSocketId),
      },
    ],
  });
};

const connectToNewRoom = async (
  firstParticipant: UserDocument,
  secondParticipant: UserDocument,
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
  successCallback: (newRoom: RoomWithParticipantStatus) => void,
) => {
  const newRoom = new RoomModel({
    roomId: uuidv4(),
    messages: [],
    participants: [firstParticipant._id, secondParticipant._id],
    activeParticipants: [firstParticipant._id, secondParticipant._id],
  });
  await newRoom.save();
  await UserModel.updateMany(
    {
      _id: { $in: [firstParticipant._id, secondParticipant._id] },
    },
    { $push: { rooms: newRoom._id } },
  );
  await socket.join(createRoomName(newRoom.roomId));
  const secondParticipantSocketId = await redisClient.get(
    secondParticipant.userId,
  );
  if (secondParticipantSocketId) {
    const secondParticipantSocket = io
      .of("/")
      .sockets.get(secondParticipantSocketId);
    await secondParticipantSocket!.join(createRoomName(newRoom.roomId));
    secondParticipantSocket!.emit("newRoom", {
      roomId: newRoom.roomId,
      participants: [
        {
          userId: firstParticipant.userId,
          name: firstParticipant.name,
          isOnline: true,
        },
      ],
      messages: [],
    });
  }
  successCallback({
    roomId: newRoom.roomId,
    messages: [],
    participants: [
      {
        userId: secondParticipant.userId,
        name: secondParticipant.name,
        isOnline: Boolean(secondParticipantSocketId),
      },
    ],
  });
};

export const handleConnectToRooms = (socket: CustomSocket) => {
  logErrors(async () => {
    const userWithRooms = await socket.data.user.populate<{ rooms: Room[] }>(
      "rooms",
    );
    const rooms = userWithRooms.rooms.map(({ roomId }) =>
      createRoomName(roomId),
    );
    socket.join(rooms);
    socket.to(rooms).emit("userJoin", socket.data.user.userId);

    socket.on("disconnect", () => {
      logErrors(() => {
        socket.to(rooms).emit("userLeave", socket.data.user.userId);
        rooms.forEach((room) => socket.leave(room));
      }, "socket leave rooms error");
    });
  }, "connect to rooms error");
};

export const handleFindExistingRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  socket.on(
    "findRoom",
    (
      secondParticipantId: string,
      callback: (room: RoomWithParticipantStatus | null) => void,
    ) => {
      logErrors(async () => {
        const secondParticipant = (await UserModel.findOne({
          userId: secondParticipantId,
        }))!;
        const existingRoom = await RoomModel.findOne({
          participants: { $all: [socket.data.user._id, secondParticipant._id] },
        }).populate<{ messages: Message[] }>("messages");
        const isSecondParticipantOnline = Boolean(
          await redisClient.get(secondParticipant.userId),
        );
        callback(
          existingRoom
            ? {
                roomId: existingRoom.roomId,
                messages: existingRoom.messages,
                participants: [
                  {
                    userId: secondParticipant.userId,
                    name: secondParticipant.name,
                    isOnline: isSecondParticipantOnline,
                  },
                ],
              }
            : null,
        );
      }, "find existing room error");
    },
  );
};

export const handleCreateRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on(
    "createRoom",
    (
      secondParticipantId: string,
      callback: (newRoom: RoomWithParticipantStatus) => void,
    ) => {
      logErrors(async () => {
        const creator = socket.data.user;
        const secondParticipant = (await UserModel.findOne({
          userId: secondParticipantId,
        }))!;
        const previouslyCreatedRoom = await RoomModel.findOne({
          participants: { $all: [creator._id, secondParticipant._id] },
        })
          .populate<{ activeParticipants: User[] }>({
            path: "activeParticipants",
            select: "userId name -_id",
          })
          .populate<{ messages: Message[] }>("messages");
        if (previouslyCreatedRoom) {
          await connectToExistingRoom(
            creator,
            secondParticipant,
            previouslyCreatedRoom as unknown as RoomWithPopulatedFields,
            socket,
            redisClient,
            callback,
          );
          await sendMessage(
            socket,
            io,
            "all",
            previouslyCreatedRoom.roomId,
            `User "${socket.data.user.name}" joined the room`,
            "system",
          );
        } else {
          await connectToNewRoom(
            creator,
            secondParticipant,
            socket,
            redisClient,
            io,
            callback,
          );
        }
      }, "create room error");
    },
  );
};

export const handleLeaveRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on(
    "leaveRoom",
    (roomId: string, callback: (status: boolean) => void) => {
      logErrors(async () => {
        const { userId } = socket.data.user;
        const room = await RoomModel.findOne({ roomId });
        if (!room) {
          return callback(false);
        }
        await UserModel.updateOne({ userId }, { $pull: { rooms: room._id } });
        const roomParticipantsCount = room.activeParticipants.length;
        if (roomParticipantsCount === 1) {
          await MessageModel.deleteMany({ _id: { $in: room.messages } });
          await RoomModel.deleteOne({ roomId });
        } else {
          await RoomModel.updateOne(
            { roomId },
            { $pull: { activeParticipants: socket.data.user._id } },
          );
          await sendMessage(
            socket,
            io,
            "all",
            roomId,
            `User "${socket.data.user.name}" has left the room`,
            "system",
          );
        }
        socket.leave(createRoomName(roomId));
        callback(true);
      }, "leave room error");
    },
  );
};

export const handleAddParticipant = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on("addParticipant", (roomId: string, newParticipantId: string) => {
    logErrors(async () => {
      const participant = (await UserModel.findById({
        userId: newParticipantId,
      }))!;
      const room = (await RoomModel.findById({ roomId }))!;
      await UserModel.updateOne(
        { userId: newParticipantId },
        { $push: { rooms: room._id } },
      );
      await RoomModel.updateOne(
        { roomId },
        {
          $push: {
            participants: participant._id,
            activeParticipants: participant._id,
          },
        },
      );
      const newParticipantSocketId = await redisClient.get(newParticipantId);
      if (newParticipantSocketId) {
        const secondParticipantSocket = io
          .of("/")
          .sockets.get(newParticipantSocketId);
        secondParticipantSocket!.join(createRoomName(room.roomId));
      }
    }, "add participant error");
  });
};
