import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import MessageModel, { Message } from "../models/Message";

export const createMessage = async (text: string, author: string) => {
  const newMessage = new MessageModel({
    messageId: uuidv4(),
    text,
    author,
    readBy: [author],
  });
  await newMessage.save();
  return newMessage;
};

export const getMessage = async (messageId: string) => {
  const message = await MessageModel.findOne({ messageId });
  return message!;
};

export const deleteRoomMessages = async (
  messagesIds: Types.Array<Types.ObjectId>,
) => {
  const res = await MessageModel.deleteMany({ _id: { $in: messagesIds } });
  return res;
};

export const readMessages = async (
  messagesIds: Message["messageId"][],
  userId: string,
) => {
  await MessageModel.updateMany(
    {
      messageId: {
        $in: messagesIds,
      },
    },
    {
      $push: {
        readBy: userId,
      },
    },
  );
};

export const updateMessage = async (messageId: string, text: string) => {
  const updatedMessage = await MessageModel.findOneAndUpdate(
    { messageId },
    { text },
    { new: true },
  );
  return updatedMessage;
};

export const deleteMessage = async (messageId: string) => {
  const result = await MessageModel.deleteOne({ messageId });
  return result;
};
