import { RedisClientType } from "@redis/client";
import _ from "lodash";
import { CustomSocket, IOServer } from "../../types";
import {
  deleteMessage,
  getMessage,
  updateMessage,
} from "../../db/functions/messages";
import { removeMessage } from "../../db/functions/rooms";
import { getRoomName, logErrors } from "../../utils";
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
      callback: (message: Omit<ResponseMessage, "author">) => void,
    ) => {
      logErrors(async () => {
        const updatedMessageDocument = await updateMessage(messageId, newText);
        const updatedMessage = _.pick(updatedMessageDocument, [
          "messageId",
          "text",
          "lastModified",
        ]) as Omit<ResponseMessage, "author">;
        socket
          .to(getRoomName(roomId))
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
        const message = await getMessage(messageId);
        await removeMessage(roomId, message._id);
        socket
          .to(getRoomName(roomId))
          .emit("message:delete", roomId, messageId);
        await deleteMessage(messageId);
        callback();
      }, "message:delete error");
    },
  );
};
