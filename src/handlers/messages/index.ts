import { RedisClientType } from "@redis/client";
import { CustomSocket, IOServer } from "../../types";
import MessageModel, { Message } from "../../db/models/Message";
import RoomModel from "../../db/models/Room";
import { logErrors } from "../../utils";
import sendMessage from "./sendMessage";

export interface ResponseMessage {
  messageId: string;
  text: string;
  author: string;
  lastModified: Date;
}

export const handleSendMessage = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on(
    "message",
    (
      roomId: string,
      text: string,
      callback: (newMessage: ResponseMessage) => void,
    ) => {
      logErrors(async () => {
        await sendMessage(
          socket,
          io,
          "excludeAuthor",
          roomId,
          text,
          socket.data.user.userId,
          callback,
        );
      }, "message error");
    },
  );
};

export const handleUpdateMessage = (socket: CustomSocket) => {
  socket.on(
    "message:update",
    (
      roomId: string,
      messageId: string,
      newText: string,
      callback: (message: Omit<Message, "author">) => void,
    ) => {
      logErrors(async () => {
        const updatedMessageDocument = await MessageModel.findOneAndUpdate(
          { messageId },
          { text: newText, $currentDate: { lastModified: true } },
        );
        const updatedMessage = {
          messageId,
          text: newText,
          lastModified: updatedMessageDocument!.lastModified,
        };
        socket
          .to(`room:${roomId}`)
          .emit("message:update", roomId, updatedMessage);
        callback(updatedMessage);
      }, "message:update error");
    },
  );
};

export const handleDeleteMessage = (socket: CustomSocket) => {
  socket.on(
    "message:delete",
    (roomId: string, messageId: string, callback: () => void) => {
      logErrors(async () => {
        const message = await MessageModel.findOne({ messageId });
        await RoomModel.updateOne(
          { roomId },
          { $pull: { messages: message!._id } },
        );
        socket.to(`room:${roomId}`).emit("message:delete", roomId, messageId);
        await MessageModel.deleteOne({ messageId });
        callback();
      }, "message:delete error");
    },
  );
};
