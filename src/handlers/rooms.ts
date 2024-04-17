import { RedisClientType } from "@redis/client";
import { v4 as uuidv4 } from "uuid";
import RoomModel, { Room } from "../db/models/Room";
import UserModel from "../db/models/User";
import { CustomSocket, IOServer } from "../types";

const createRoomName = (roomId: string) => `room:${roomId}`;

export const handleConnectToRooms = async (socket: CustomSocket) => {
  const userWithRooms = await socket.data.user.populate<{ rooms: Room[] }>(
    "rooms",
  );
  const rooms = userWithRooms.rooms.map(({ roomId }) => createRoomName(roomId));
  socket.join(rooms);
  socket.to(rooms).emit("userJoin", socket.data.user.userId);

  socket.on("disconnect", () => {
    socket.to(rooms).emit("userLeave", socket.data.user.userId);
    rooms.forEach((room) => socket.leave(room));
  });
};

export const handleCreateRoom = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on("createRoom", async (secondParticipantId: string) => {
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
    creator.rooms.push(newRoom._id);
    await creator.save();
    secondParticipant.rooms.push(newRoom._id);
    await secondParticipant.save();
    socket.join(createRoomName(newRoom.roomId));
    const secondParticipantSocket = [...io.of("/").sockets.values()].find(
      (currentSocket: CustomSocket) =>
        currentSocket.data.user.userId === secondParticipantId,
    );
    if (secondParticipantSocket) {
      secondParticipantSocket.join(createRoomName(newRoom.roomId));
    }
  });
};

export const handleLeaveRoom = (socket: CustomSocket) => {
  socket.on("leaveRoom", async (roomId: string) => {
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
  });
};

export const handleAddParticipant = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on(
    "addParticipant",
    async (roomId: string, newParticipantId: string) => {
      const participant = (await UserModel.findById({
        userId: newParticipantId,
      }))!;
      const room = (await RoomModel.findById({ roomId }))!;
      participant.rooms.push(room._id);
      await participant.save();
      room.participants.push(participant._id);
      await room.save();
      const participantSocket = [...io.of("/").sockets.values()].find(
        (currentSocket: CustomSocket) =>
          currentSocket.data.user.userId === newParticipantId,
      );
      if (participantSocket) {
        participantSocket.join(createRoomName(roomId));
      }
    },
  );
};
