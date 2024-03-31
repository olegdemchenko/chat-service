import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";

export const handleUpdateUserStatus = async (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  await redisClient.SADD("active_users", socket.data.user._id.toString());

  socket.on("disconnect", async () => {
    await redisClient.SREM("active_users", socket.data.user._id.toString());
  });
};
