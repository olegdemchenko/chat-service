import { ExtendedError } from "socket.io/dist/namespace";
import axios, { AxiosError } from "axios";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { CustomSocket, ExternalUserInfo } from "../types";
import UserModel from "../db/models/User";

dotenv.config();

const authenticateUser = async (
  socket: CustomSocket,
  next: (err?: ExtendedError | undefined) => void,
) => {
  const { token } = socket.handshake.auth;
  try {
    const { data: userInfo } = await axios.get<ExternalUserInfo>(
      process.env.AUTH_SERVICE_URL!,
      {
        headers: {
          Authorization: `Bearer ${token as string}`,
        },
      },
    );
    const { id, name } = userInfo;
    let user = await UserModel.findOne({ externalId: id });
    if (!user) {
      user = new UserModel({
        userId: uuidv4(),
        externalId: id,
        name,
        rooms: [],
      });
      await user.save();
    }
    socket.data.user = user;
    next();
  } catch (e) {
    if (e instanceof AxiosError && e.response?.status === 400) {
      return next(new Error("User token is invalid"));
    }
    next(e as Error);
  }
};

export default authenticateUser;
