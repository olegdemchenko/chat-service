import { RedisClientType } from "@redis/client";
import { CustomSocket, IOServer } from "../types";
import UserModel from "../db/models/User";

const findUsers = (socket: CustomSocket, redisClient: RedisClientType) => {
  socket.on("findUsers", async (nameFragment: string) => {
    const match = await UserModel.find({
      name: { $regex: new RegExp(nameFragment) },
      externalId: { $ne: socket.data.user.externalId },
    });
    const activeUsers = await redisClient.SMEMBERS("active_users");
    const usersWithStatuses = match.map(({ _id, name, email }) => ({
      id: _id,
      name,
      email,
      isOnline: activeUsers.includes(_id.toString()),
    }));
    socket.emit("foundUsers", usersWithStatuses);
  });
};

const trackUserStatus = async (
  socketInstance: CustomSocket,
  redisClient: RedisClientType,
) => {
  await redisClient.SADD(
    "active_users",
    socketInstance.data.user._id.toString(),
  );

  socketInstance.on("disconnect", async () => {
    await redisClient.SREM(
      "active_users",
      socketInstance.data.user._id.toString(),
    );
  });
};

const addHandlers = (
  io: IOServer,
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  const handlers: ((
    socket: CustomSocket,
    redisClient: RedisClientType,
    io: IOServer,
  ) => void)[] = [trackUserStatus, findUsers];
  handlers.forEach((handler) => handler(socket, redisClient, io));
};

export default addHandlers;
