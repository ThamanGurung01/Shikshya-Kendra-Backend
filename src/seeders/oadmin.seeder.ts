import { School } from "../models/school.model";
import { User } from "../models/user.model";
import { hashPassword } from "../utils/hash.util";
import { connectDB, closeDB } from "../configs/db";
import { DEFAULT_PASSWORD } from "./allSeed.seeder";

const EXAMPLE_SCHOOL_EMAIL = "example.school@test.com";
const EXAMPLE_OADMIN_EMAIL = "oadmin@test.com";

export const schoolSeeder = async () => {
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
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
  console.log("Example school and OAdmin Seeded");
};

if (require.main === module) {
  (async () => {
    await connectDB();
    await schoolSeeder();
    await closeDB();
  })();
}