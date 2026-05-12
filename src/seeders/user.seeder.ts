import { User } from "../models/user.model";
import { hashPassword } from "../utils/hash.util";

export const userData = async () => {
    const hashedPassword = await hashPassword("password123");
    await User.findOneAndUpdate(
      { email: "superadmin@gmail.com" },
      {
        $set: {
          name: "Super Admin",
          email: "superadmin@gmail.com",
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

    console.log("Superadmin created");
};