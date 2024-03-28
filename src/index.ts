import dotenv from "dotenv";
import { Server } from "socket.io";
import { RedisClientType } from "@redis/client";
import { CustomSocket } from "./types";
import connectDB from "./db/config";
import authenticateUser from "./middlewares/authenticateUser";
import redisClient from "./redisClient";
import addHandlers from "./handlers";

dotenv.config();

connectDB()
  .then(() => redisClient)
  .then((client) => {
    const io = new Server(Number(process.env.PORT!));
    io.use(authenticateUser);

    io.on("connection", (socket: CustomSocket) => {
      addHandlers(io, socket, client as RedisClientType);
    });
  })
  .catch((e) => console.error(`Server initialization error: ${e}`));
