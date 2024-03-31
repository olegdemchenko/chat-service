import { RedisClientType } from "@redis/client";
import { CustomSocket, IOServer } from "../types";
import {
  handleAddParticipant,
  handleConnectToRooms,
  handleCreateRoom,
  handleLeaveRoom,
} from "./rooms";
import { handleFindUsers } from "./search";
import { handleUpdateUserStatus } from "./init";

const addHandlers = (
  io: IOServer,
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  const handlers: ((
    socket: CustomSocket,
    redisClient: RedisClientType,
    io: IOServer,
  ) => void)[] = [
    handleUpdateUserStatus,
    handleFindUsers,
    handleConnectToRooms,
    handleCreateRoom,
    handleLeaveRoom,
    handleAddParticipant,
  ];
  handlers.forEach((handler) => handler(socket, redisClient, io));
};

export default addHandlers;
