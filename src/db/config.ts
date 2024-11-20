import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  const url = process.env.DB_URL!;
  try {
    await mongoose.connect(url);
  } catch (e) {
    console.error("DB connection error", e);
    throw e;
  }

  const { connection } = mongoose;
  connection.once("open", () => {
    console.log(`Database connected at ${url}`);
  });
  connection.on("error", (e) => {
    console.error("Connection error", e);
  });
};

export default connectDB;
