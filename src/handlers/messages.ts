import { v4 as uuidv4 } from "uuid";
import { CustomSocket } from "../types";
import MessageModel from "../db/models/Message";
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
        createdAt: string;
      }) => void,
    ) => {
      logErrors(async () => {
        const newMessage = new MessageModel({
          messageId: uuidv4(),
          text,
          author: socket.data.user.userId,
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
          createdAt: newMessage.createdAt.toDateString(),
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
    (roomId: string, messageId: string, newText: string) => {
      logErrors(async () => {
        const updatedMessageDocument = await MessageModel.findOneAndUpdate(
          { messageId },
          { text: newText },
        );
        socket.to(`room:${roomId}`).emit("message:update", roomId, {
          id: messageId,
          newText,
          updatedAt: updatedMessageDocument?.updatedAt,
        });
      }, "message:update error");
    },
  );
};

export const handleDeleteMessage = (socket: CustomSocket) => {
  socket.on("message:delete", (roomId: string, messageId: string) => {
    logErrors(async () => {
      const message = await MessageModel.findOne({ messageId });
      await RoomModel.updateOne(
        { roomId },
        { $pull: { messages: message!._id } },
      );
      socket.to(`room:${roomId}`).emit("message:delete", roomId, messageId);
      await MessageModel.deleteOne({ messageId });
    }, "message:delete error");
  });
};
