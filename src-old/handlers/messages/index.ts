import { RedisClientType } from "@redis/client";
import _ from "lodash";
import { CustomSocket, IOServer } from "../../types";
import {
  deleteMessage,
  getMessage,
  readMessages,
  updateMessage,
} from "../../db/utils/messages";
import { removeMessageFromRoom } from "../../db/utils/rooms";
import { getRoomName, logErrors } from "../../utils";
import sendMessage from "./sendMessage";
import { Message } from "../../db/models/Message";
import { ChatEvents } from "../../constants";

export const handleSendMessage = (
  socket: CustomSocket,
  redisClient: RedisClientType,
  io: IOServer,
) => {
  socket.on(
    ChatEvents.message,
    (roomId: string, text: string, callback: (newMessage: Message) => void) => {
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

export const handleReadMessages = (socket: CustomSocket) => {
  socket.on(ChatEvents.readMessages, (messagesIds: Message["messageId"][]) => {
    logErrors(async () => {
      await readMessages(messagesIds, socket.data.user.userId);
    }, "read messages error");
  });
};

export const handleUpdateMessage = (socket: CustomSocket) => {
  socket.on(
    ChatEvents.updateMessage,
    (
      roomId: string,
      messageId: string,
      newText: string,
      callback: (message: Omit<Message, "author">) => void,
    ) => {
      logErrors(async () => {
        const updatedMessageDocument = await updateMessage(messageId, newText);
        const updatedMessage = _.pick(updatedMessageDocument, [
          "messageId",
          "text",
          "author",
          "createdAt",
          "updatedAt",
        ]) as Message;
        socket
          .to(getRoomName(roomId))
          .emit(ChatEvents.updateMessage, roomId, updatedMessage);
        callback(updatedMessage);
      }, "message:update error");
    },
  );
};

export const handleDeleteMessage = (socket: CustomSocket) => {
  socket.on(
    ChatEvents.deleteMessage,
    (roomId: string, messageId: string, callback: () => void) => {
      logErrors(async () => {
        const message = await getMessage(messageId);
        await removeMessageFromRoom(roomId, message._id);
        socket
          .to(getRoomName(roomId))
          .emit(ChatEvents.deleteMessage, roomId, messageId);
        await deleteMessage(messageId);
        callback();
      }, "message:delete error");
    },
  );
};
