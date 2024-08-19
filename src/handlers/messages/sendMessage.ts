import _ from "lodash";
import { CustomSocket, IOServer } from "../../types";
import { Message } from "../../db/models/Message";
import { createMessage } from "../../db/utils/messages";
import { addMessageToRoom } from "../../db/utils/rooms";
import { ChatEvents } from "../../constants";
import { getRoomName } from "../../utils";

export default async (
  socket: CustomSocket,
  io: IOServer,
  to: "all" | "excludeAuthor",
  roomId: string,
  text: string,
  author: string,
  callback?: (newMessage: Message) => void,
) => {
  const newMessageDocument = await createMessage(text, author);
  await addMessageToRoom(roomId, newMessageDocument._id);
  const message = _.pick(newMessageDocument, [
    "messageId",
    "author",
    "text",
    "createdAt",
    "updatedAt",
  ]);
  if (to === "excludeAuthor") {
    socket.to(getRoomName(roomId)).emit(ChatEvents.message, roomId, message);
    callback?.(message as Message);
  } else {
    io.to(getRoomName(roomId)).emit(ChatEvents.message, roomId, message);
  }
};
