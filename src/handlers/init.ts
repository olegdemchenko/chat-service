import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";
import RoomModel from "../db/models/Room";

export const handleUpdateUserStatus = async (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  await redisClient.SADD("active_users", socket.data.user.userId);

  socket.on("disconnect", async () => {
    await redisClient.SREM("active_users", socket.data.user.userId);
  });
};

export const handleSendUserData = (socket: CustomSocket) => {
  socket.on("getUserData", async (callback) => {
    const { userId } = socket.data.user;
    const userRooms = await RoomModel.find({
      participants: { $elemMatch: { $eq: userId } },
    })
      .populate("messages")
      .populate("participants");
    callback(userRooms);
  });
};
