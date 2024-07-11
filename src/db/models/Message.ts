import { Schema, model } from "mongoose";

export interface Message {
  messageId: string;
  text: string;
  author: string;
  lastModified: Date;
}

export const messageSchema = new Schema<Message>({
  messageId: {
    type: String,
    required: true,
    unique: true,
  },
  text: String,
  author: String,
  lastModified: { type: Date, default: Date.now },
});

export default model<Message>("Message", messageSchema);
