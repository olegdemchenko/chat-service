import { createClient } from "redis";
import { RedisClientType } from "@redis/client";

const redisClient = createClient({
  socket: {
    host: "chat_redis",
    port: 6380,
  },
});

redisClient.on("error", (e) => {
  console.log(`Cannot connect to Redis client: ${e}`);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis successfully");
});

export const getSocketId = async (client: RedisClientType, key: string) => {
  const result = await client.get(key);
  return result;
};

export const saveSocketId = async (
  client: RedisClientType,
  key: string,
  id: string,
) => {
  const res = await client.set(key, id);
  return res;
};

export const deleteSocketId = async (client: RedisClientType, key: string) => {
  const res = await client.del(key);
  return res;
};

export const isSocketIdSaved = async (client: RedisClientType, key: string) => {
  const res = await client.get(key);
  return Boolean(res);
};

export default redisClient.connect();
