import { Schema, model, Types } from "mongoose";

export interface User {
  _id: Types.ObjectId;
  externalId: number;
  name: string;
  email: string | null;
}

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
    required: true,
    unique: true,
  },
});

export default model<User>("User", userSchema);
