import { Schema, model, Types, HydratedDocument } from "mongoose";

export interface Room<T = Types.ObjectId, K = Types.ObjectId> {
  roomId: string;
  messages: Types.Array<T>;
  participants: Types.Array<K>;
  activeParticipants: Types.Array<K>;
  messagesCount: number;
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
  activeParticipants: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export default model<Room>("Room", roomSchema);
