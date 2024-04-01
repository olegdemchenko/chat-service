import { Schema, model, Types, HydratedDocument } from "mongoose";

interface Room {
  _id: Types.ObjectId;
  messages: Types.Array<Types.ObjectId>;
  participants: Types.Array<Types.ObjectId>;
}

export type RoomDocument = HydratedDocument<Room>;

const roomSchema = new Schema<Room>({
  messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export default model<Room>("Room", roomSchema);
