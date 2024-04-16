import { Schema, model, Types, HydratedDocument } from "mongoose";

interface User {
  userId: string;
  externalId: number;
  name: string;
  rooms: Types.Array<Types.ObjectId>;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
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
  rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
});

export default model<User>("User", userSchema);
