import { RedisClientType } from "@redis/client";
import { CustomSocket } from "../types";
import { logErrors } from "../utils";
import { findUsers } from "../db/utils/users";
import { isSocketIdSaved } from "../redisClient";
import { ChatEvents, USERS_PER_PAGE } from "../constants";

export const handleFindUsers = (
  socket: CustomSocket,
  redisClient: RedisClientType,
) => {
  socket.on(
    ChatEvents.findUsers,
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
        const [match, matchCount] = await findUsers(
          query,
          socket.data.user.externalId,
          page,
          USERS_PER_PAGE,
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
