import { User } from "../models/user.model";
import { School } from "../models/school.model";
import { hashPassword } from "../utils/hash.util";

const DEFAULT_PASSWORD = "password123";
const EXAMPLE_SCHOOL_EMAIL = "example.school@test.com";
const EXAMPLE_OADMIN_EMAIL = "oadmin@test.com";

export const userData = async () => {
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

    console.log("Superadmin created");

    const oadmin = await User.findOneAndUpdate(
      { email: EXAMPLE_OADMIN_EMAIL },
      {
        $set: {
          name: "Example OAdmin",
          email: EXAMPLE_OADMIN_EMAIL,
          password: hashedPassword,
          role: "oadmin",
          is_active: true,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    await School.findOneAndUpdate(
      { school_email: EXAMPLE_SCHOOL_EMAIL },
      {
        $set: {
          slug: "example-school",
          school_name: "Example School",
          address: "Kathmandu, Nepal",
          contact: "9800000000",
          school_email: EXAMPLE_SCHOOL_EMAIL,
          website: "https://example-school.edu.np",
          map: "https://maps.google.com/?q=Example+School",
          city: "Kathmandu",
          country: "Nepal",
          owner_id: oadmin._id,
          documents: {
            panCertificate: {
              type: "image",
              value: "https://example.com/pan-certificate.pdf",
            },
            registrationCertificate: "https://example.com/registration-certificate.pdf",
          },
          verifiedAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    console.log("Example school and OAdmin created");
};