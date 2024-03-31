import { Schema, model, Types, HydratedDocument } from "mongoose";
import { messageSchema, Message } from "./Message";

interface Room {
  _id: Types.ObjectId;
  messages: Types.DocumentArray<Message>;
  participants: Types.Array<Types.ObjectId>;
}

export type RoomDocument = HydratedDocument<Room>;

const roomSchema = new Schema<Room>({
  messages: [messageSchema],
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export default model<Room>("Room", roomSchema);
