import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/config";

dotenv.config();

const app = express();
app.use(express.json());

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () =>
      console.log(`Chat service is listening on port: ${process.env.PORT}`),
    );
  })
  .catch((e) => console.error(`Server initialization error: ${e}`));
