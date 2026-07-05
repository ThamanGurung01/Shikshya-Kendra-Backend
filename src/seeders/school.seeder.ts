import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db";
import { School } from "../models/school.model";
import { User } from "../models/user.model";
import { Admin } from "../models/admin.model";
import { Accountant } from "../models/accountant.model";
import { Librarian } from "../models/librarian.model";
import { Parent } from "../models/parent.model";
import { Student } from "../models/student.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { ClassModel as Class } from "../models/class.model";
import { SectionModel as Section } from "../models/section.model";
import { AcademicYear } from "../models/academic-year.model";
import { hashPassword } from "../utils/hash.util";
import { generateUniqueSlug } from "../utils/slug.util";
import { DEFAULT_PASSWORD } from "./allSeed.seeder";

const seedSchool = async () => {
  try {
    console.log("Purging old school-related data...");
    await Class.deleteMany({});
    await Section.deleteMany({});
    await AcademicYear.deleteMany({});
    await StudentEnrollment.deleteMany({});
    await Admin.deleteMany({});
    await Accountant.deleteMany({});
    await Librarian.deleteMany({});
    await Parent.deleteMany({});
    await Student.deleteMany({});
    await School.deleteMany({ school_email: { $ne: "example.school@test.com" } });
    await User.deleteMany({ role: { $nin: ["superadmin", "oadmin"] } });

    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    console.log("Creating OAdmin user (school owner)...");
    const oadminUser = await User.findOneAndUpdate(
      { email: "oadmin@shikshyakendra.edu.np" },
      {
        $set: {
          name: "School Owner OAdmin",
          email: "oadmin@shikshyakendra.edu.np",
          password: hashedPassword,
          role: "oadmin",
          is_active: true,
        },
      },
      { upsert: true, new: true }
    );

    console.log("Creating admin users...");
    const admin1User = await new User({
      name: "School Admin",
      email: "admin@shikshyakendra.edu.np",
      password: hashedPassword,
      role: "admin",
      is_active: true,
    }).save();

    const admin2User = await new User({
      name: "Vice Principal Admin",
      email: "viceprincipal@shikshyakendra.edu.np",
      password: hashedPassword,
      role: "admin",
      is_active: true,
    }).save();

    const admin3User = await new User({
      name: "Academic Admin",
      email: "academic@shikshyakendra.edu.np",
      password: hashedPassword,
      role: "admin",
      is_active: true,
    }).save();

    console.log("Creating School...");
    const schoolSlug = await generateUniqueSlug(School, "Shikshya Kendra Model School");
    const school = await new School({
      slug: schoolSlug,
      school_name: "Shikshya Kendra Model School",
      address: "Lazimpat, Kathmandu",
      contact: "014412345",
      school_email: "info@shikshyakendra.edu.np",
      website: "https://www.shikshyakendra.edu.np",
      map: "https://maps.google.com/?q=Shikshya+Kendra+Model+School",
      city: "Kathmandu",
      country: "Nepal",
      owner_id: oadminUser._id,
      documents: {
        panCertificate: { type: "image", value: "https://example.com/pan-certificate.pdf" },
        registrationCertificate: "https://example.com/registration-certificate.pdf",
      },
      verifiedAt: new Date(),
    }).save();
    console.log(`School created with ID: ${school._id}`);

    console.log("Creating Admin records...");
    await new Admin({
      employeeId: "ADM001",
      adminName: "School Admin",
      address: "Kathmandu",
      gender: "Male",
      contact: "9851011111",
      dob: new Date("1985-03-15"),
      admin_email: "admin@shikshyakendra.edu.np",
      schoolId: school._id,
      userId: admin1User._id,
      status: "active",
      qualification: "M.Ed. in Administration",
      joinDate: new Date("2020-01-01"),
    }).save();

    await new Admin({
      employeeId: "ADM002",
      adminName: "Vice Principal Admin",
      address: "Kathmandu",
      gender: "Female",
      contact: "9851022222",
      dob: new Date("1988-07-20"),
      admin_email: "viceprincipal@shikshyakendra.edu.np",
      schoolId: school._id,
      userId: admin2User._id,
      status: "active",
      qualification: "M.Ed.",
      joinDate: new Date("2020-01-01"),
    }).save();

    await new Admin({
      employeeId: "ADM003",
      adminName: "Academic Admin",
      address: "Kathmandu",
      gender: "Male",
      contact: "9851033333",
      dob: new Date("1990-11-10"),
      admin_email: "academic@shikshyakendra.edu.np",
      schoolId: school._id,
      userId: admin3User._id,
      status: "active",
      qualification: "B.Ed.",
      joinDate: new Date("2021-06-01"),
    }).save();

    console.log("Creating Accountant...");
    const accountantUser = await new User({
      name: "Hari Bansha",
      email: "accountant@shikshyakendra.edu.np",
      password: hashedPassword,
      role: "accountant",
      is_active: true,
    }).save();

    await new Accountant({
      employeeId: "ACC001",
      accountantName: "Hari Bansha",
      address: "Kathmandu",
      gender: "Male",
      contact: "9851044444",
      dob: new Date("1982-05-25"),
      accountant_email: "accountant@shikshyakendra.edu.np",
      schoolId: school._id,
      userId: accountantUser._id,
      status: "active",
      qualification: "MBA in Finance",
      joinDate: new Date("2020-01-01"),
    }).save();

    console.log("Creating Librarian...");
    const librarianUser = await new User({
      name: "Madan Krishna",
      email: "librarian@shikshyakendra.edu.np",
      password: hashedPassword,
      role: "librarian",
      is_active: true,
    }).save();

    await new Librarian({
      employeeId: "LIB001",
      librarianName: "Madan Krishna",
      address: "Kathmandu",
      gender: "Male",
      contact: "9851055555",
      dob: new Date("1986-09-12"),
      librarian_email: "librarian@shikshyakendra.edu.np",
      schoolId: school._id,
      userId: librarianUser._id,
      status: "active",
      qualification: "B.Lib.Sc.",
      joinDate: new Date("2020-01-01"),
    }).save();

    console.log("Creating Academic Year...");
    const academicYear = await new AcademicYear({
      schoolId: school._id,
      name: "2082/83",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      isCurrent: true,
    }).save();
    console.log(`Academic Year: ${academicYear.name}`);

    console.log("Creating Classes 1 to 10 and Sections A & B...");
    const classes: any[] = [];
    const sections: any[] = [];

    for (let c = 1; c <= 10; c++) {
      const cls = await new Class({
        schoolId: school._id,
        name: `Class ${c}`,
      }).save();
      classes.push(cls);

      const secA = await new Section({
        schoolId: school._id,
        classId: cls._id,
        name: "Section A",
      }).save();
      sections.push(secA);

      const secB = await new Section({
        schoolId: school._id,
        classId: cls._id,
        name: "Section B",
      }).save();
      sections.push(secB);
    }
    console.log(`${classes.length} classes and ${sections.length} sections created.`);

    console.log("Creating Parent Users...");
    const parentUsers: any[] = [];
    for (let i = 1; i <= 20; i++) {
      const pUser = await new User({
        name: `Parent Num_${i}`,
        email: `parent${i}@shikshyakendra.edu.np`,
        password: hashedPassword,
        role: "parent",
        is_active: true,
      }).save();
      parentUsers.push(pUser);
    }

    console.log("Creating Parent records...");
    const parentDocs: any[] = [];
    for (let i = 0; i < parentUsers.length; i++) {
      const parentDoc = await new Parent({
        fatherName: i % 3 !== 0 ? `Father Num_${i + 1}` : undefined,
        fatherPhone: i % 3 !== 0 ? `9861000${(i + 1).toString().padStart(2, "0")}` : undefined,
        motherName: i % 3 !== 2 ? `Mother Num_${i + 1}` : undefined,
        motherPhone: i % 3 !== 2 ? `9862000${(i + 1).toString().padStart(2, "0")}` : undefined,
        guardianName: i % 3 === 0 ? `Guardian Num_${i + 1}` : undefined,
        guardianPhone: i % 3 === 0 ? `9863000${(i + 1).toString().padStart(2, "0")}` : undefined,
        relation: i % 3 === 0 ? "Uncle" : undefined,
        primarygurdianemail: `parent${i + 1}@shikshyakendra.edu.np`,
        userId: parentUsers[i]._id,
      }).save();
      parentDocs.push(parentDoc);
    }

    console.log("Creating Student Users and Enrollments...");
    const studentUsers: any[] = [];
    const parentStudentMap: Map<number, mongoose.Types.ObjectId[]> = new Map();
    let studentCounter = 0;

    for (let cIdx = 0; cIdx < classes.length; cIdx++) {
      const cls = classes[cIdx];
      const classSections = sections.filter(
        (s) => s.classId.toString() === cls._id.toString()
      );

      for (const sec of classSections) {
        for (let sNum = 1; sNum <= 5; sNum++) {
          const idx = studentCounter;
          const parentIdx = idx % parentUsers.length;

          const studentUser = await new User({
            name: `Student Num_${idx + 1}`,
            email: `student${idx + 1}@shikshyakendra.edu.np`,
            password: hashedPassword,
            role: "student",
            is_active: true,
          }).save();
          studentUsers.push(studentUser);

          const minDate = new Date("2012-01-01").getTime();
          const maxDate = new Date("2018-12-31").getTime();
          const randomDob = new Date(minDate + Math.random() * (maxDate - minDate));

          const student = await new Student({
            admissionNumber: `ADM-${(idx + 10001).toString()}`,
            studentName: `Student Num_${idx + 1}`,
            address: "Kathmandu",
            gender: idx % 2 === 0 ? "Male" : "Female",
            contact: `9821000${idx.toString().padStart(3, "0")}`,
            dob: randomDob,
            student_email: `student${idx + 1}@shikshyakendra.edu.np`,
            schoolId: school._id,
            userId: studentUser._id,
            status: "active",
            parentId: parentDocs[parentIdx]._id,
            healthInfo: { bloodGroup: ["O+", "A+", "B+", "AB+"][idx % 4] },
          }).save();

          await new StudentEnrollment({
            studentId: student._id,
            schoolId: school._id,
            academicYearId: academicYear._id,
            classId: cls._id,
            sectionId: sec._id,
            rollNumber: sNum,
            studentEnrollmentStatus: "active",
            joinedAt: new Date(),
          }).save();

          // Track which students belong to which parent
          if (!parentStudentMap.has(parentIdx)) {
            parentStudentMap.set(parentIdx, []);
          }
          parentStudentMap.get(parentIdx)!.push(student._id);

          studentCounter++;
        }
      }
    }
    console.log(`${studentCounter} students created with enrollments.`);

    // Parent records already have the primary email; students already linked via parentId field.
    console.log("School seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding school data:", error);
    throw error;
  }
};

export { seedSchool };

if (require.main === module) {
  const { connectDB, closeDB } = require("../configs/db");
  (async () => {
    await connectDB();
    await seedSchool();
    await closeDB();
  })();
}
