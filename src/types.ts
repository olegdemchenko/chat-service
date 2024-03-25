import { Socket } from "socket.io";

export interface ExternalUserInfo {
  id: number;
  name: string;
  email: string | null;
}

export interface User {
  name: string;
  email?: string | null;
}
export interface CustomSocket extends Socket {
  user?: User;
}
