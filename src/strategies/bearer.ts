import { Strategy as BearerStrategy } from "passport-http-bearer";
import axios from "axios";
import { UserInfo } from "../types";
import User from "../db/models/User";

export default new BearerStrategy(async (token, done) => {
  try {
    const { data: userInfo } = await axios.get<UserInfo>(
      "http://authservice-server-1:443/api/auth/authenticate",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const { name, email } = userInfo;
    let user = await User.findOne({ name });
    if (!user) {
      user = new User({
        name,
        email,
      });
      await user.save();
    }
    done(null, user);
  } catch (e) {
    done(e);
  }
});
