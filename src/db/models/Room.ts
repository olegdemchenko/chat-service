import { Schema, model, Types, HydratedDocument } from "mongoose";

export interface Room {
  roomId: string;
  messages: Types.Array<Types.ObjectId>;
  participants: Types.Array<Types.ObjectId>;
}

export type RoomDocument = HydratedDocument<Room>;

const roomSchema = new Schema<Room>({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export default model<Room>("Room", roomSchema);
