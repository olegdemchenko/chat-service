import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";
import RoomModel from "../db/models/Room";
import { logErrors } from "../utils";
import { Message } from "../db/models/Message";
import { User } from "../db/models/User";

export const handleUpdateUserStatus = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  logErrors(async () => {
    await redisClient.set(socket.data.user.userId, socket.id);
    socket.on("disconnect", () => {
      logErrors(async () => {
        await redisClient.del(socket.data.user.userId);
      }, "redis delete user error");
    });
  }, "redis add user error");
};

export const handleSendUserData = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  socket.on("getUserRooms", (callback) => {
    logErrors(async () => {
      const { _id } = socket.data.user;
      const userRooms = await RoomModel.find({
        participants: { $elemMatch: { $eq: _id } },
      })
        .populate<{ messages: Message[] }>("messages")
        .populate<{ participants: User[] }>({
          path: "participants",
          match: { _id: { $ne: _id } },
        });
      const roomsWithUsersStatuses = await Promise.all(
        userRooms.map(async ({ roomId, messages, participants }) => {
          const participantsWithStatuses = await Promise.all(
            participants.map(async ({ userId, name }) => {
              return {
                userId,
                name,
                isOnline: Boolean(await redisClient.get(userId)),
              };
            }),
          );

          return { roomId, messages, participants: participantsWithStatuses };
        }),
      );
      callback(roomsWithUsersStatuses);
    }, "getUserData error");
  });
};
