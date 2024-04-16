import { Schema, model, Types } from "mongoose";

export interface Message {
  messageId: string;
  text: string;
  author: Types.ObjectId;
  date: number;
}

export const messageSchema = new Schema<Message>({
  messageId: {
    type: String,
    required: true,
    unique: true,
  },
  text: String,
  author: { type: Schema.Types.ObjectId, ref: "User" },
  date: Number,
});

export default model<Message>("Message", messageSchema);
