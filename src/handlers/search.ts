import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";
import UserModel from "../db/models/User";
import { logErrors } from "../utils";

export const handleFindUsers = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  socket.on(
    "findUsers",
    (
      nameFragment: string,
      callback: (
        foundUsers: readonly {
          userId: string;
          name: string;
          isOnline: boolean;
        }[],
      ) => void,
    ) => {
      logErrors(async () => {
        const match = await UserModel.find(
          {
            name: { $regex: new RegExp(nameFragment) },
            externalId: { $ne: socket.data.user.externalId },
          },
          ["name", "email"],
        );
        const usersWithStatuses = await Promise.all(
          match.map(async ({ userId, name }) => ({
            userId,
            name,
            isOnline: Boolean(await redisClient.get(userId)),
          })),
        );
        callback(usersWithStatuses);
      }, "find users error");
    },
  );
};
