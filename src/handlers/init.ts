import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";
import { logErrors } from "../utils";
import { getUserRooms } from "../db/utils/rooms";
import { saveSocketId, deleteSocketId, isSocketIdSaved } from "../redisClient";

export const handleUpdateUserStatus = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  logErrors(async () => {
    await saveSocketId(redisClient, socket.data.user.userId, socket.id);
    socket.on("disconnect", () => {
      logErrors(async () => {
        await deleteSocketId(redisClient, socket.data.user.userId);
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
      const userRooms = await getUserRooms(_id);
      const roomsWithUsersStatuses = await Promise.all(
        userRooms.map(async ({ roomId, messages, participants }) => {
          const participantsWithStatuses = await Promise.all(
            participants.map(async ({ userId, name }) => {
              return {
                userId,
                name,
                isOnline: await isSocketIdSaved(redisClient, userId),
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
