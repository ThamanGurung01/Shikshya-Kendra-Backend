import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import { User } from "../models/user";

dotenv.config();

export const userData = async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.findOneAndUpdate(
      { email: "superadmin@gmail.com" },
      {
        $set: {
          name: "Super Admin",
          email: "superadmin@gmail.com",
          password: hashedPassword,
          role: "superadmin",
          verified_date: new Date(),
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