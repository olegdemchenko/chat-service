import { ExtendedError } from "socket.io/dist/namespace";
import axios, { AxiosError } from "axios";
import { CustomSocket, ExternalUserInfo } from "../types";
import UserModel from "../db/models/User";

const authenticateUser = async (
  socket: CustomSocket,
  next: (err?: ExtendedError | undefined) => void,
) => {
  const { token } = socket.handshake.headers;
  try {
    const { data: userInfo } = await axios.get<ExternalUserInfo>(
      "http://authservice-server-1:443/api/auth/authenticate",
      {
        headers: {
          Authorization: `Bearer ${token as string}`,
        },
      },
    );
    const { id, name, email } = userInfo;
    let user = await UserModel.findOne({ externalId: id });
    if (!user) {
      user = new UserModel({
        externalId: id,
        name,
        email,
      });
      await user.save();
    }
    socket.data.user = user;
    next();
  } catch (e) {
    const error = e as Error;
    if (error instanceof AxiosError) {
      return next(new Error("User token is invalid"));
    }
    next(error);
  }
};

export default authenticateUser;
