import { Schema, model } from "mongoose";

export interface Message {
  messageId: string;
  text: string;
  author: string;
  createdAt: Date;
  updateAt: Date;
  readBy: string[];
}

export const messageSchema = new Schema<Message>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    text: String,
    author: String,
    readBy: [String],
  },
  { timestamps: true },
);

export default model<Message>("Message", messageSchema);
