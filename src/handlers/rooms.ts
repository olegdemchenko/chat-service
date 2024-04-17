import { RedisClientType } from "@redis/client";
import { v4 as uuidv4 } from "uuid";
import RoomModel, { Room } from "../db/models/Room";
import UserModel from "../db/models/User";
import { CustomSocket, IOServer } from "../types";

export const handleConnectToRooms = async (socket: CustomSocket) => {
  const userWithRooms = await socket.data.user.populate<{ rooms: Room[] }>(
    "rooms",
  );
  const roomIds = userWithRooms.rooms.map(({ roomId }) => roomId);
  socket.join(roomIds);

  socket.on("disconnect", () => {
    roomIds.forEach((id) => socket.leave(id));
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
    socket.join(`room:${newRoom.roomId}`);
    const secondParticipantSocket = [...io.of("/").sockets.values()].find(
      (currentSocket: CustomSocket) =>
        currentSocket.data.user.userId === secondParticipantId,
    );
    if (secondParticipantSocket) {
      secondParticipantSocket.join(`room:${newRoom.roomId}`);
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
    socket.leave(`room:${roomId}`);
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
        participantSocket.join(`room:${room.roomId}`);
      }
    },
  );
};
