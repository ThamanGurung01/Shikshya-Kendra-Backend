import "dotenv/config";
import { connectDB, closeDB } from "../configs/db";

export const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "password123";

async function main() {
  await connectDB();

  console.log("=== Running all seeders in sequence ===");

  const { userData } = await import("./superadmin.seeder");
  await userData();

  const { schoolSeeder } = await import("./oadmin.seeder");
  await schoolSeeder();

  const { seedSchool } = await import("./school.seeder");
  await seedSchool();

  const { seedTeachers } = await import("./teacher.seeder");
  await seedTeachers();

  const { seedBooks } = await import("./book.seeder");
  await seedBooks();

  console.log("=== All seeders completed successfully ===");

  await closeDB();
}

if (require.main === module) {
  main().catch((err) => {
    console.error("All-seed failed:", err);
    process.exit(1);
  });
}
