import { Schema, model, Types } from "mongoose";

export interface Message {
  _id: Types.ObjectId;
  text: string;
  author: Types.ObjectId;
  date: number;
}

export const messageSchema = new Schema<Message>({
  text: String,
  author: { type: Schema.Types.ObjectId, ref: "User" },
  date: Number,
});

export default model<Message>("Message", messageSchema);
