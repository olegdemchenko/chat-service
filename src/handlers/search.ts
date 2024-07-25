import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";
import { logErrors } from "../utils";
import { findUsers } from "../db/functions/users";
import { isSocketIdSaved } from "../redisClient";

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
        const [match, matchCount] = await findUsers(
          query,
          socket.data.user.externalId,
          page,
          resultsPerPage,
        );
        const usersWithStatuses = await Promise.all(
          match.map(async ({ userId, name }) => ({
            userId,
            name,
            isOnline: await isSocketIdSaved(redisClient, userId),
          })),
        );
        callback(usersWithStatuses, matchCount);
      }, "find users error");
    },
  );
};
