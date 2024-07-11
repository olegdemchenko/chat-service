import { v4 as uuidv4 } from "uuid";
import { CustomSocket } from "../types";
import MessageModel, { Message } from "../db/models/Message";
import RoomModel from "../db/models/Room";
import { logErrors } from "../utils";

export const handleSendMessage = (socket: CustomSocket) => {
  socket.on(
    "message",
    (
      roomId: string,
      text: string,
      callback: (newMessage: {
        messageId: string;
        text: string;
        author: string;
        lastModified: Date;
      }) => void,
    ) => {
      logErrors(async () => {
        const newMessage = new MessageModel({
          messageId: uuidv4(),
          text,
          author: socket.data.user.userId,
          lastModified: new Date(),
        });
        await newMessage.save();
        await RoomModel.updateOne(
          { roomId },
          { $push: { messages: newMessage._id } },
        );
        const message = {
          messageId: newMessage.messageId,
          author: socket.data.user.userId,
          text,
          lastModified: newMessage.lastModified,
        };
        socket.to(`room:${roomId}`).emit("message", roomId, message);
        callback(message);
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
