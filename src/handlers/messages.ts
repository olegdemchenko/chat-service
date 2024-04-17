import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { CustomSocket } from "../types";
import MessageModel from "../db/models/Message";
import RoomModel from "../db/models/Room";

export const handleSendMessage = (socket: CustomSocket) => {
  socket.on("message", async (roomId: string, text: string) => {
    const newMessage = new MessageModel({
      messageId: uuidv4(),
      text,
      author: new mongoose.mongo.ObjectId(socket.data.user.userId),
    });
    const messageDocument = await newMessage.save();
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
        createdAt: messageDocument.createdAt,
      }),
    );
  });
};

export const handleUpdateMessage = (socket: CustomSocket) => {
  socket.on(
    "message:update",
    async (roomId: string, messageId: string, newText: string) => {
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
    },
  );
};

export const handleDeleteMessage = (socket: CustomSocket) => {
  socket.on("message:delete", async (roomId: string, messageId: string) => {
    await MessageModel.deleteOne({ messageId });
    const message = await MessageModel.findOne({ messageId });
    await RoomModel.updateOne(
      { roomId },
      { $pull: { messages: message!._id } },
    );
    socket.to(`room:${roomId}`).emit("message:delete", messageId);
  });
};
