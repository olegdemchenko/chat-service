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
      query: string,
      page: number,
      callback: (
        foundUsers: readonly {
          userId: string;
          name: string;
          isOnline: boolean;
        }[],
        count: number,
      ) => void,
    ) => {
      logErrors(async () => {
        const resultsPerPage = 3;
        const searchCriteria = {
          name: { $regex: new RegExp(query) },
          externalId: { $ne: socket.data.user.externalId },
        };
        const match = await UserModel.find(searchCriteria, null, {
          skip: page * resultsPerPage,
          limit: resultsPerPage,
        });
        const matchCount = await UserModel.countDocuments(searchCriteria);
        const usersWithStatuses = await Promise.all(
          match.map(async ({ userId, name }) => ({
            userId,
            name,
            isOnline: Boolean(await redisClient.get(userId)),
          })),
        );
        callback(usersWithStatuses, matchCount);
      }, "find users error");
    },
  );
};
