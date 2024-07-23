import { v4 as uuidv4 } from "uuid";
import { CustomSocket, IOServer } from "../../types";
import MessageModel from "../../db/models/Message";
import RoomModel from "../../db/models/Room";
import { type ResponseMessage } from ".";

export default async (
  socket: CustomSocket,
  io: IOServer,
  to: "all" | "excludeAuthor",
  roomId: string,
  text: string,
  author: string,
  callback?: (newMessage: ResponseMessage) => void,
) => {
  const newMessage = new MessageModel({
    messageId: uuidv4(),
    text,
    author,
    lastModified: new Date(),
  });
  await newMessage.save();
  await RoomModel.updateOne(
    { roomId },
    { $push: { messages: newMessage._id } },
  );
  const message = {
    messageId: newMessage.messageId,
    author,
    text,
    lastModified: newMessage.lastModified,
  };
  if (to === "excludeAuthor") {
    socket.to(`room:${roomId}`).emit("message", roomId, message);
    callback?.(message);
  } else {
    io.to(`room:${roomId}`).emit("message", roomId, message);
  }
};
