import { Schema, model, Types } from "mongoose";

export interface Message {
  _id: Types.ObjectId;
  text: string;
  author: string;
  date: number;
}

export const messageSchema = new Schema<Message>({
  text: String,
  author: String,
  date: Number,
});

export default model<Message>("Message", messageSchema);
