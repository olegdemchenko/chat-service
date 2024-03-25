import { Schema, model } from "mongoose";

const userSchema = new Schema({
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
});

export default model("User", userSchema);
