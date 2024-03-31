import { Types } from "mongoose";
import { RedisClientType } from "@redis/client";
import RoomModel from "../db/models/Room";
import UserModel from "../db/models/User";
import { CustomSocket, IOServer } from "../types";

export const handleConnectToRooms = (socket: CustomSocket) => {
  const {
    user: { rooms },
  } = socket.data;
  const roomIds = rooms.map(({ _id }) => _id.toString());
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
    const creatorId = socket.data.user._id;
    const creator = socket.data.user;
    const newRoom = new RoomModel({
      messages: [],
      participants: [
        new Types.ObjectId(creatorId),
        new Types.ObjectId(secondParticipantId),
      ],
    });
    await newRoom.save();
    creator.rooms.push(newRoom._id);
    await creator.save();
    const secondParticipant = (await UserModel.findById(secondParticipantId))!;
    secondParticipant.rooms.push(newRoom._id);
    await secondParticipant.save();
    socket.join(`room:${newRoom._id.toString()}`);
    const secondParticipantSocket = [...io.of("/").sockets.values()].find(
      (currentSocket: CustomSocket) =>
        currentSocket.data.user._id.toString() === secondParticipantId,
    );
    if (secondParticipantSocket) {
      secondParticipantSocket.join(`room:${newRoom._id.toString()}`);
    }
  });
};

export const handleLeaveRoom = (socket: CustomSocket) => {
  socket.on("leaveRoom", async (roomId: string) => {
    const { _id } = socket.data.user;
    await UserModel.updateOne({ _id }, { $pull: { rooms: roomId } });
    const room = (await RoomModel.findById(roomId))!;
    const roomParticipantsCount = room.participants.length;
    if (roomParticipantsCount === 1) {
      await RoomModel.deleteOne({ _id: roomId });
    } else {
      await RoomModel.updateOne(
        { _id: roomId },
        { $pull: { participants: _id } },
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
        _id: newParticipantId,
      }))!;
      const room = (await RoomModel.findById({ _id: roomId }))!;
      participant.rooms.push(room._id);
      await participant.save();
      room.participants.push(participant._id);
      await room.save();
      const participantSocket = [...io.of("/").sockets.values()].find(
        (currentSocket: CustomSocket) =>
          currentSocket.data.user._id.toString() === newParticipantId,
      );
      if (participantSocket) {
        participantSocket.join(`room:${room._id.toString()}`);
      }
    },
  );
};
