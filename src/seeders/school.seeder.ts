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

    // Predefined Realistic Nepali Families (20 Families)
    const families = [
      {
        surname: "Sharma",
        fatherName: "Ram Prasad Sharma",
        fatherPhone: "9861011111",
        motherName: "Sita Devi Sharma",
        motherPhone: "9862011111",
        guardianName: "Ram Prasad Sharma",
        guardianPhone: "9861011111",
        relation: "Father",
        email: "ram.sharma@shikshyakendra.edu.np",
        userName: "Ram Prasad Sharma",
      },
      {
        surname: "Shrestha",
        fatherName: "Bikash Shrestha",
        fatherPhone: "9861022222",
        motherName: "Sunita Shrestha",
        motherPhone: "9862022222",
        guardianName: "Bikash Shrestha",
        guardianPhone: "9861022222",
        relation: "Father",
        email: "bikash.shrestha@shikshyakendra.edu.np",
        userName: "Bikash Shrestha",
      },
      {
        surname: "Adhikari",
        fatherName: "Rajesh Adhikari",
        fatherPhone: "9861033333",
        motherName: "Gita Adhikari",
        motherPhone: "9862033333",
        guardianName: "Gita Adhikari",
        guardianPhone: "9862033333",
        relation: "Mother",
        email: "gita.adhikari@shikshyakendra.edu.np",
        userName: "Gita Adhikari",
      },
      {
        surname: "Thapa",
        fatherName: "Dipendra Thapa",
        fatherPhone: "9861044444",
        motherName: "Radhika Thapa",
        motherPhone: "9862044444",
        guardianName: "Dipendra Thapa",
        guardianPhone: "9861044444",
        relation: "Father",
        email: "dipendra.thapa@shikshyakendra.edu.np",
        userName: "Dipendra Thapa",
      },
      {
        surname: "Joshi",
        fatherName: "Manoj Joshi",
        fatherPhone: "9861055555",
        motherName: "Laxmi Joshi",
        motherPhone: "9862055555",
        guardianName: "Manoj Joshi",
        guardianPhone: "9861055555",
        relation: "Father",
        email: "manoj.joshi@shikshyakendra.edu.np",
        userName: "Manoj Joshi",
      },
      {
        surname: "Karki",
        fatherName: undefined,
        fatherPhone: undefined,
        motherName: "Nabina Karki",
        motherPhone: "9862066666",
        guardianName: "Nabina Karki",
        guardianPhone: "9862066666",
        relation: "Mother",
        email: "nabina.karki@shikshyakendra.edu.np",
        userName: "Nabina Karki",
      },
      {
        surname: "Maharjan",
        fatherName: "Suresh Maharjan",
        fatherPhone: "9861077777",
        motherName: "Bina Maharjan",
        motherPhone: "9862077777",
        guardianName: "Suresh Maharjan",
        guardianPhone: "9861077777",
        relation: "Father",
        email: "suresh.maharjan@shikshyakendra.edu.np",
        userName: "Suresh Maharjan",
      },
      {
        surname: "Gurung",
        fatherName: "Karma Gurung",
        fatherPhone: "9861088888",
        motherName: "Dolma Gurung",
        motherPhone: "9862088888",
        guardianName: "Karma Gurung",
        guardianPhone: "9861088888",
        relation: "Father",
        email: "karma.gurung@shikshyakendra.edu.np",
        userName: "Karma Gurung",
      },
      {
        surname: "Rai",
        fatherName: "Ashok Rai",
        fatherPhone: "9861099999",
        motherName: "Kalpana Rai",
        motherPhone: "9862099999",
        guardianName: "Ashok Rai",
        guardianPhone: "9861099999",
        relation: "Father",
        email: "ashok.rai@shikshyakendra.edu.np",
        userName: "Ashok Rai",
      },
      {
        surname: "Khatri",
        fatherName: "Prakash Khatri",
        fatherPhone: "9861100000",
        motherName: "Parvati Khatri",
        motherPhone: "9862100000",
        guardianName: "Hari Prasad Khatri",
        guardianPhone: "9863100000",
        relation: "Uncle",
        email: "hari.khatri@shikshyakendra.edu.np",
        userName: "Hari Prasad Khatri",
      },
      {
        surname: "Dahal",
        fatherName: "Bishnu Dahal",
        fatherPhone: "9861111111",
        motherName: "Maya Dahal",
        motherPhone: "9862111111",
        guardianName: "Bishnu Dahal",
        guardianPhone: "9861111111",
        relation: "Father",
        email: "bishnu.dahal@shikshyakendra.edu.np",
        userName: "Bishnu Dahal",
      },
      {
        surname: "Devkota",
        fatherName: "Homnath Devkota",
        fatherPhone: "9861122222",
        motherName: "Shanta Devkota",
        motherPhone: "9862122222",
        guardianName: "Homnath Devkota",
        guardianPhone: "9861122222",
        relation: "Father",
        email: "homnath.devkota@shikshyakendra.edu.np",
        userName: "Homnath Devkota",
      },
      {
        surname: "Regmi",
        fatherName: "Khemraj Regmi",
        fatherPhone: "9861133333",
        motherName: "Saraswati Regmi",
        motherPhone: "9862133333",
        guardianName: "Khemraj Regmi",
        guardianPhone: "9861133333",
        relation: "Father",
        email: "khemraj.regmi@shikshyakendra.edu.np",
        userName: "Khemraj Regmi",
      },
      {
        surname: "Neupane",
        fatherName: "Krishna Neupane",
        fatherPhone: "9861144444",
        motherName: "Kamala Neupane",
        motherPhone: "9862144444",
        guardianName: "Krishna Neupane",
        guardianPhone: "9861144444",
        relation: "Father",
        email: "krishna.neupane@shikshyakendra.edu.np",
        userName: "Krishna Neupane",
      },
      {
        surname: "Ghimire",
        fatherName: "Narayan Ghimire",
        fatherPhone: "9861155555",
        motherName: "Menuka Ghimire",
        motherPhone: "9862155555",
        guardianName: "Narayan Ghimire",
        guardianPhone: "9861155555",
        relation: "Father",
        email: "narayan.ghimire@shikshyakendra.edu.np",
        userName: "Narayan Ghimire",
      },
      {
        surname: "Bhattarai",
        fatherName: "Madhav Bhattarai",
        fatherPhone: "9861166666",
        motherName: "Anita Bhattarai",
        motherPhone: "9862166666",
        guardianName: "Madhav Bhattarai",
        guardianPhone: "9861166666",
        relation: "Father",
        email: "madhav.bhattarai@shikshyakendra.edu.np",
        userName: "Madhav Bhattarai",
      },
      {
        surname: "KC",
        fatherName: "Janak KC",
        fatherPhone: "9861177777",
        motherName: "Srijana KC",
        motherPhone: "9862177777",
        guardianName: "Janak KC",
        guardianPhone: "9861177777",
        relation: "Father",
        email: "janak.kc@shikshyakendra.edu.np",
        userName: "Janak KC",
      },
      {
        surname: "Subedi",
        fatherName: "Hari Subedi",
        fatherPhone: "9861188888",
        motherName: "Nirmala Subedi",
        motherPhone: "9862188888",
        guardianName: "Nirmala Subedi",
        guardianPhone: "9862188888",
        relation: "Mother",
        email: "nirmala.subedi@shikshyakendra.edu.np",
        userName: "Nirmala Subedi",
      },
      {
        surname: "Gautam",
        fatherName: "Balaram Gautam",
        fatherPhone: "9861199999",
        motherName: "Bhagawati Gautam",
        motherPhone: "9862199999",
        guardianName: "Balaram Gautam",
        guardianPhone: "9861199999",
        relation: "Father",
        email: "balaram.gautam@shikshyakendra.edu.np",
        userName: "Balaram Gautam",
      },
      {
        surname: "Poudel",
        fatherName: "Ganesh Poudel",
        fatherPhone: "9861200000",
        motherName: "Suntali Poudel",
        motherPhone: "9862200000",
        guardianName: "Ganesh Poudel",
        guardianPhone: "9861200000",
        relation: "Father",
        email: "ganesh.poudel@shikshyakendra.edu.np",
        userName: "Ganesh Poudel",
      },
    ];

    // Pools of Authentic Given Names for Boys and Girls (50 each)
    const boyFirstNames = [
      "Aarav", "Rohan", "Ayush", "Saugat", "Bikram", "Prabin", "Samir", "Bibek", "Sujan", "Nishan",
      "Prashant", "Anish", "Sahil", "Roshan", "Kshitiz", "Dipesh", "Subash", "Manish", "Sabin", "Saujan",
      "Aayush", "Siddharth", "Rehan", "Niraj", "Milan", "Nischal", "Jenish", "Suraj", "Abhishek", "Rahul",
      "Saroj", "Rabin", "Ashish", "Dipendra", "Shishir", "Bishal", "Sandesh", "Sugam", "Rohit", "Saurav",
      "Rajan", "Hemant", "Pawan", "Kiran", "Bipin", "Prakash", "Sundar", "Dinesh", "Kamal", "Rupesh",
    ];

    const girlFirstNames = [
      "Aaradhya", "Puja", "Shreya", "Sneha", "Samriddhi", "Pragya", "Anusha", "Kriti", "Smriti", "Bina",
      "Ritu", "Anjali", "Nisha", "Priya", "Sushma", "Dikshya", "Archana", "Roshni", "Salina", "Manisha",
      "Prasansha", "Karuna", "Ashika", "Asmita", "Deepika", "Isha", "Kristina", "Alisha", "Kabita", "Rashmi",
      "Bipana", "Sabina", "Swastika", "Upasana", "Menuka", "Rachana", "Priyanka", "Swechha", "Rejina", "Subeksha",
      "Aakriti", "Bhawana", "Niru", "Sujata", "Pooja", "Aasha", "Kabita", "Pratima", "Reena", "Simran",
    ];

    const kathmanduAddresses = [
      "Lazimpat, Kathmandu", "New Baneshwor, Kathmandu", "Baluwatar, Kathmandu", "Jhamsikhel, Lalitpur",
      "Koteshwor, Kathmandu", "Sanepa, Lalitpur", "Chabahil, Kathmandu", "Maharajgunj, Kathmandu",
      "Thamel, Kathmandu", "Hattisar, Kathmandu", "Naxal, Kathmandu", "Tinkune, Kathmandu",
      "Kalanki, Kathmandu", "Dillibazar, Kathmandu", "Bhatbhateni, Kathmandu", "Samakhusi, Kathmandu",
      "Kumaripati, Lalitpur", "Jawalakhel, Lalitpur", "Suryabinayak, Bhaktapur", "Thimi, Bhaktapur",
    ];

    console.log("Creating Parent Users...");
    const parentUsers: any[] = [];
    for (let i = 0; i < families.length; i++) {
      const fam = families[i]!;
      const pUser = await new User({
        name: fam.userName,
        email: fam.email,
        password: hashedPassword,
        role: "parent",
        is_active: true,
      }).save();
      parentUsers.push(pUser);
    }

    console.log("Creating Parent records...");
    const parentDocs: any[] = [];
    for (let i = 0; i < parentUsers.length; i++) {
      const fam = families[i]!;
      const parentDoc = await new Parent({
        fatherName: fam.fatherName,
        fatherPhone: fam.fatherPhone,
        motherName: fam.motherName,
        motherPhone: fam.motherPhone,
        guardianName: fam.guardianName,
        guardianPhone: fam.guardianPhone,
        relation: fam.relation,
        primarygurdianemail: fam.email,
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
          const family = families[parentIdx]!;

          const isMale = idx % 2 === 0;
          const gender = isMale ? "Male" : "Female";
          const nameIndex = Math.floor(idx / 2);
          const firstName = isMale ? boyFirstNames[nameIndex]! : girlFirstNames[nameIndex]!;
          const studentFullName = `${firstName} ${family.surname}`;
          const studentEmail = `${firstName.toLowerCase()}.${family.surname.toLowerCase()}@shikshyakendra.edu.np`;
          const address = kathmanduAddresses[idx % kathmanduAddresses.length]!;

          const studentUser = await new User({
            name: studentFullName,
            email: studentEmail,
            password: hashedPassword,
            role: "student",
            is_active: true,
          }).save();
          studentUsers.push(studentUser);

          // Calculate age based on Class level (Class 1: ~6 yrs old born ~2020, Class 10: ~15 yrs old born ~2011)
          const birthYear = 2020 - cIdx;
          const birthMonth = (idx % 12 + 1).toString().padStart(2, "0");
          const birthDay = (idx % 28 + 1).toString().padStart(2, "0");
          const studentDob = new Date(`${birthYear}-${birthMonth}-${birthDay}`);

          const student = await new Student({
            admissionNumber: `ADM-${(idx + 10001).toString()}`,
            studentName: studentFullName,
            address: address,
            gender: gender,
            contact: `98210${(idx + 1000).toString().padStart(4, "0")}`,
            dob: studentDob,
            student_email: studentEmail,
            schoolId: school._id,
            userId: studentUser._id,
            status: "active",
            parentId: parentDocs[parentIdx]._id,
            healthInfo: { bloodGroup: ["O+", "A+", "B+", "AB+", "O-"][idx % 5] },
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
