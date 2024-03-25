import dotenv from "dotenv";
import { Server } from "socket.io";
import { CustomSocket } from "./types";
import connectDB from "./db/config";
import authenticateUser from "./middlewares/authenticateUser";

dotenv.config();

connectDB()
  .then(() => {
    const io = new Server(Number(process.env.PORT!));
    io.use(authenticateUser);
    io.on("connection", (socket: CustomSocket) => {
      console.log(`socket ${socket.id} connected`);
      console.log("user", socket.user);
    });
  })
  .catch((e) => console.error(`Server initialization error: ${e}`));
