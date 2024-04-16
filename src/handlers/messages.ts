import mongoose from "mongoose";
import { CustomSocket } from "../types";
import MessageModel from "../db/models/Message";
import RoomModel from "../db/models/Room";

export const handleSendMessage = (socket: CustomSocket) => {
  socket.on("message", async (roomId: string, text: string) => {
    const date = new Date();
    const newMessage = new MessageModel({
      text,
      author: new mongoose.mongo.ObjectId(socket.data.user.userId),
      date,
    });
    await newMessage.save();
    await RoomModel.updateOne(
      { roomId },
      { $push: { messages: newMessage._id } },
    );
    socket.to(`room:${roomId}`).emit(
      "message",
      JSON.stringify({
        id: newMessage._id.toString(),
        author: socket.data.user.userId,
        text,
        date,
      }),
    );
  });
};

export const handleUpdateMessage = (socket: CustomSocket) => {
  socket.on(
    "message:update",
    async (roomId: string, messageId: string, newText: string) => {
      const date = new Date();
      await MessageModel.updateOne({ _id: messageId }, { text: newText, date });
      socket
        .to(`room:${roomId}`)
        .emit(
          "message:update",
          JSON.stringify({ id: messageId, newText, date }),
        );
    },
  );
};

export const handleDeleteMessage = (socket: CustomSocket) => {
  socket.on("message:delete", async (roomId: string, messageId: string) => {
    await MessageModel.deleteOne({ _id: messageId });
    await RoomModel.updateOne({ roomId }, { $pull: { messages: messageId } });
    socket.to(`room:${roomId}`).emit("message:delete", messageId);
  });
};
