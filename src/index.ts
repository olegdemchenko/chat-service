import dotenv from "dotenv";
import { Server } from "socket.io";
import { CustomSocket } from "./types";
import connectDB from "./db/config";
import authenticateUser from "./middlewares/authenticateUser";
import redisClient from "./redisClient";

dotenv.config();

connectDB()
  .then(() => redisClient)
  .then((redis) => {
    const io = new Server(Number(process.env.PORT!));
    io.use(authenticateUser);

    io.on("connection", async (socket: CustomSocket) => {
      await redis.SADD("active_users", socket.data.user._id.toString());

      socket.on("disconnect", async () => {
        await redis.SREM("active_users", socket.data.user._id.toString());
      });
    });
  })
  .catch((e) => console.error(`Server initialization error: ${e}`));
