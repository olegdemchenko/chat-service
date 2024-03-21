import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import connectDB from "./db/config";
import router from "./routes";
import bearer from "./strategies/bearer";

dotenv.config();

passport.use(bearer);
const app = express();
app.use(express.json());
app.use(passport.authenticate("bearer", { session: false }));
app.use("/", router);

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () =>
      console.log(`Chat service is listening on port: ${process.env.PORT}`),
    );
  })
  .catch((e) => console.error(`Server initialization error: ${e}`));
