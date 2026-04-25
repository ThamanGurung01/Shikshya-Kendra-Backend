import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import { User } from "../models/user";
import { Role } from "../models/role";

dotenv.config();

export const userData = async () => {
    const superadminRole = await Role.findOne({ name: "superadmin" });

    if (!superadminRole) {
      throw new Error("Superadmin role not found. Run role seeder first.");
    }
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.findOneAndUpdate(
      { email: "superadmin@gmail.com" },
      {
        $set: {
          name: "Super Admin",
          email: "superadmin@gmail.com",
          password: hashedPassword,
          role: superadminRole._id,
          verified_date: new Date(),
          is_active: true,
          isActive: true,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    console.log("Superadmin created");
};