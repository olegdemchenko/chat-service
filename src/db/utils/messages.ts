import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import MessageModel from "../models/Message";

export const createMessage = async (text: string, author: string) => {
  const newMessage = new MessageModel({
    messageId: uuidv4(),
    text,
    author,
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

export const updateMessage = async (messageId: string, text: string) => {
  const updatedMessage = await MessageModel.findOneAndUpdate(
    { messageId },
    { text },
  );
  return updatedMessage;
};

export const deleteMessage = async (messageId: string) => {
  const result = await MessageModel.deleteOne({ messageId });
  return result;
};
