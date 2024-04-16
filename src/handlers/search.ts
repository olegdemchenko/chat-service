import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";
import UserModel from "../db/models/User";

export const handleFindUsers = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  socket.on(
    "findUsers",
    async (
      nameFragment: string,
      callback: (
        foundUsers: readonly {
          userId: string;
          name: string;
          isOnline: boolean;
        }[],
      ) => void,
    ) => {
      const match = await UserModel.find(
        {
          name: { $regex: new RegExp(nameFragment) },
          externalId: { $ne: socket.data.user.externalId },
        },
        ["name", "email"],
      );
      const activeUsers = await redisClient.SMEMBERS("active_users");
      const usersWithStatuses = match.map(({ userId, name }) => ({
        userId,
        name,
        isOnline: activeUsers.includes(userId),
      }));
      callback(usersWithStatuses);
    },
  );
};
