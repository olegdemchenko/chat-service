import { RedisClientType } from "@redis/client";
import { v4 as uuidv4 } from "uuid";
import RoomModel, { Room } from "../db/models/Room";
import UserModel from "../db/models/User";
import { CustomSocket, IOServer } from "../types";
import { logErrors } from "../utils";

const createRoomName = (roomId: string) => `room:${roomId}`;

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

export const handleCreateRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on(
    "createRoom",
    (secondParticipantId: string, callback: (newRoomId: string) => void) => {
      logErrors(async () => {
        const creator = socket.data.user;
        const secondParticipant = (await UserModel.findOne({
          userId: secondParticipantId,
        }))!;
        const newRoom = new RoomModel({
          roomId: uuidv4(),
          messages: [],
          participants: [creator._id, secondParticipant._id],
        });
        await newRoom.save();
        await UserModel.updateMany(
          {
            _id: { $in: [creator._id, secondParticipant._id] },
          },
          { $push: { rooms: newRoom._id } },
        );
        socket.join(createRoomName(newRoom.roomId));
        const secondParticipantSocketId =
          await redisClient.get(secondParticipantId);
        if (secondParticipantSocketId) {
          const secondParticipantSocket = io
            .of("/")
            .sockets.get(secondParticipantSocketId);
          secondParticipantSocket!.join(createRoomName(newRoom.roomId));
        }
        callback(newRoom.roomId);
      }, "create room error");
    },
  );
};

export const handleLeaveRoom = (socket: CustomSocket) => {
  socket.on("leaveRoom", (roomId: string) => {
    logErrors(async () => {
      const { userId } = socket.data.user;
      const room = (await RoomModel.findById(roomId))!;
      await UserModel.updateOne({ userId }, { $pull: { rooms: room._id } });
      const roomParticipantsCount = room.participants.length;
      if (roomParticipantsCount === 1) {
        await RoomModel.deleteOne({ roomId });
      } else {
        await RoomModel.updateOne(
          { roomId },
          { $pull: { participants: socket.data.user._id } },
        );
      }
      socket.leave(createRoomName(roomId));
    }, "leave room error");
  });
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
        { $push: { participants: participant._id } },
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
