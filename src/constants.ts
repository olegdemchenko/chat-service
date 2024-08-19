export const MESSAGES_PER_PAGE = 15;
export const USERS_PER_PAGE = 5;

export enum ChatEvents {
  connect = "connect",
  connectError = "connect_error",
  getUserRooms = "getUserRooms",
  findUsers = "findUsers",
  findRoom = "findRoom",
  connectToRoom = "connectToRoom",
  createRoom = "createRoom",
  leaveRoom = "leaveRoom",
  newRoom = "newRoom",
  message = "message",
  loadMoreMessages = "loadMoreMessages",
  updateMessage = "message:update",
  deleteMessage = "message:delete",
  userJoin = "userJoin",
  userLeave = "userLeave",
}
