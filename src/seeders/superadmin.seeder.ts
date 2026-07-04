import { User } from "../models/user.model";
import { hashPassword } from "../utils/hash.util";
import { connectDB } from "../configs/db";
import { DEFAULT_PASSWORD } from "./allSeed";


export const userData = async () => {
  await connectDB();
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
    await User.findOneAndUpdate(
      { email: "superadmin@test.com" },
      {
        $set: {
          name: "Super Admin",
          email: "superadmin@test.com",
          password: hashedPassword,
          role: "superadmin",
          is_active: true,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    console.log("Superadmin Seeded");


};
userData();