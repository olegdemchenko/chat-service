import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";
import RoomModel from "../db/models/Room";
import { logErrors } from "../utils";

export const handleUpdateUserStatus = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  logErrors(async () => {
    await redisClient.set(socket.data.user.userId, socket.id);
    socket.on("disconnect", (reason: string) => {
      console.log("disconnect reason", reason);
      logErrors(async () => {
        await redisClient.del(socket.data.user.userId);
      }, "redis delete user error");
    });
  }, "redis add user error");
};

export const handleSendUserData = (socket: CustomSocket) => {
  socket.on("getUserData", (callback) => {
    logErrors(async () => {
      const { _id } = socket.data.user;
      const userRooms = await RoomModel.find({
        participants: { $elemMatch: { $eq: _id } },
      })
        .populate("messages")
        .populate("participants");
      callback(userRooms);
    }, "getUserData error");
  });
};
