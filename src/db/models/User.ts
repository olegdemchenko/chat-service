import { Schema, model, Types, HydratedDocument } from "mongoose";

interface User {
  _id: Types.ObjectId;
  externalId: number;
  name: string;
  email: string | null;
  rooms: Types.Array<Types.ObjectId>;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>({
  externalId: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
  },
  rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
});

export default model<User>("User", userSchema);
