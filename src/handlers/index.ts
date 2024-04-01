import { RedisClientType } from "@redis/client";
import { CustomSocket, IOServer } from "../types";
import * as roomHandlers from "./rooms";
import * as searchHandlers from "./search";
import * as initialHandlers from "./init";
import * as messageHandlers from "./messages";

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
    ...Object.values(initialHandlers),
    ...Object.values(searchHandlers),
    ...Object.values(roomHandlers),
    ...Object.values(messageHandlers),
  ];
  handlers.forEach((handler) => handler(socket, redisClient, io));
};

export default addHandlers;
