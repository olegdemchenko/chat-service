import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";
import RoomModel from "../db/models/Room";

export const handleUpdateUserStatus = async (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  await redisClient.set(socket.data.user.userId, socket.id);
  socket.on("disconnect", async () => {
    await redisClient.del(socket.data.user.userId);
  });
};

export const handleSendUserData = (socket: CustomSocket) => {
  socket.on("getUserData", async (callback) => {
    const { _id } = socket.data.user;
    const userRooms = await RoomModel.find({
      participants: { $elemMatch: { $eq: _id } },
    })
      .populate("messages")
      .populate("participants");
    callback(userRooms);
  });
};
