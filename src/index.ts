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
    const io = new Server(Number(process.env.PORT!), {
      cors: {
        origin: "http://localhost:3000",
      },
    });

    io.use(authenticateUser);

    io.on("connection", (socket: CustomSocket) => {
      addHandlers(io, socket, client as RedisClientType);
    });
    io.engine.on("connection_error", (err) => {
      console.log("socket_connection_error", err);
    });
  })
  .catch((e) => console.error(`Server initialization error: ${e}`));
