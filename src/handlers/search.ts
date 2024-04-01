import { Types } from "mongoose";
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
        foundUsers: {
          id: Types.ObjectId;
          name: string;
          email: string | null;
          isOnline: boolean;
        }[],
      ) => void,
    ) => {
      const match = await UserModel.find({
        name: { $regex: new RegExp(nameFragment) },
        externalId: { $ne: socket.data.user.externalId },
      });
      const activeUsers = await redisClient.SMEMBERS("active_users");
      const usersWithStatuses = match.map(({ _id, name, email }) => ({
        id: _id,
        name,
        email,
        isOnline: activeUsers.includes(_id.toString()),
      }));
      callback(usersWithStatuses);
    },
  );
};
