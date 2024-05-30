import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { CustomSocket } from "../types";
import MessageModel from "../db/models/Message";
import RoomModel from "../db/models/Room";
import { logErrors } from "../utils";

export const handleSendMessage = (socket: CustomSocket) => {
  socket.on("message", (roomId: string, text: string) => {
    logErrors(async () => {
      const newMessage = new MessageModel({
        messageId: uuidv4(),
        text,
        author: new mongoose.mongo.ObjectId(socket.data.user.userId),
      });
      await newMessage.save();
      await RoomModel.updateOne(
        { roomId },
        { $push: { messages: newMessage._id } },
      );
      socket.to(`room:${roomId}`).emit(
        "message",
        JSON.stringify({
          id: newMessage.messageId,
          author: socket.data.user.userId,
          text,
          createdAt: newMessage.createdAt,
        }),
      );
    }, "message error");
  });
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
        socket.to(`room:${roomId}`).emit(
          "message:update",
          JSON.stringify({
            id: messageId,
            newText,
            updatedAt: updatedMessageDocument?.updatedAt,
          }),
        );
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
      socket.to(`room:${roomId}`).emit("message:delete", messageId);
      await MessageModel.deleteOne({ messageId });
    }, "message:delete error");
  });
};
