import { createClient } from "redis";

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

export default redisClient.connect();
