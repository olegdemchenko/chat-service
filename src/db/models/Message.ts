import { Schema, model, Types } from "mongoose";

export interface Message {
  messageId: string;
  text: string;
  author: Types.ObjectId;
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
    author: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default model<Message>("Message", messageSchema);
