import { RedisClientType } from "@redis/client";
import { User } from "../db/models/User";
import { Message } from "../db/models/Message";
import { Room } from "../db/models/Room";
import { CustomSocket } from "../types";
import { logErrors } from "../utils";
import { getUserRooms } from "../db/utils/rooms";
import { saveSocketId, deleteSocketId, isSocketIdSaved } from "../redisClient";
import { ChatEvents } from "../constants";

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

export const handleSendUserId = (socket: CustomSocket) => {
  socket.on(ChatEvents.getUserId, (callback: (userId: string) => void) => {
    callback(socket.data.user.userId);
  });
};

export const handleSendUserData = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  socket.on(ChatEvents.getUserRooms, (callback) => {
    logErrors(async () => {
      const { _id } = socket.data.user;
      const userRooms = await getUserRooms(_id, socket.data.user.userId);
      const roomsWithUsersStatuses = await Promise.all(
        (
          userRooms as (Room<Message, User> & { unreadMessagesCount: number })[]
        ).map(
          async ({
            roomId,
            messages,
            participants,
            messagesCount,
            unreadMessagesCount,
          }) => {
            const participantsWithStatuses = await Promise.all(
              participants.map(async ({ userId, name }) => {
                return {
                  userId,
                  name,
                  isOnline: await isSocketIdSaved(redisClient, userId),
                };
              }),
            );

            return {
              roomId,
              messages,
              participants: participantsWithStatuses,
              messagesCount,
              unreadMessagesCount,
            };
          },
        ),
      );
      callback(roomsWithUsersStatuses);
    }, "getUserData error");
  });
};
