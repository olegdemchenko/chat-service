import { Socket, Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { UserDocument } from "./db/models/User";

export interface ExternalUserInfo {
  id: number;
  name: string;
  email: string | null;
}

export type IOServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap
>;

export type CustomSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  { user: UserDocument }
>;
