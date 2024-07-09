import { Schema, model } from "mongoose";

export interface Message {
  messageId: string;
  text: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
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
  },
  { timestamps: true },
);

export default model<Message>("Message", messageSchema);
