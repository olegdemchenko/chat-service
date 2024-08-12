import _ from "lodash";
import { CustomSocket, IOServer } from "../../types";
import RoomModel from "../../db/models/Room";
import { type ResponseMessage } from ".";
import { createMessage } from "../../db/utils/messages";

export default async (
  socket: CustomSocket,
  io: IOServer,
  to: "all" | "excludeAuthor",
  roomId: string,
  text: string,
  author: string,
  callback?: (newMessage: ResponseMessage) => void,
) => {
  const newMessageDocument = await createMessage(text, author);
  await RoomModel.updateOne(
    { roomId },
    { $push: { messages: newMessageDocument._id } },
  );
  const message = _.pick(newMessageDocument, [
    "messageId",
    "author",
    "text",
    "lastModified",
  ]);
  if (to === "excludeAuthor") {
    socket.to(`room:${roomId}`).emit("message", roomId, message);
    callback?.(message);
  } else {
    io.to(`room:${roomId}`).emit("message", roomId, message);
  }
};
