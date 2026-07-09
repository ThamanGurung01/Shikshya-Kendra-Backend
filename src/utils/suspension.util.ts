import { School } from "../models/school.model";
import { Admin } from "../models/admin.model";
import { Teacher } from "../models/teacher.model";
import { Student } from "../models/student.model";
import { Parent } from "../models/parent.model";
import { Accountant } from "../models/accountant.model";
import { Librarian } from "../models/librarian.model";

export const checkSchoolSuspension = async (user: any): Promise<boolean> => {
  if (user.role === "superadmin") return false;

  let schoolId: any = null;

  if (user.role === "oadmin") {
    const school = await School.findOne({ owner_id: user._id });
    if (school && school.suspendedAt) {
      return true;
    }
    return false;
  }

  if (user.role === "admin") {
    const record = await Admin.findOne({ userId: user._id });
    schoolId = record?.schoolId;
  } else if (user.role === "teacher") {
    const record = await Teacher.findOne({ userId: user._id });
    schoolId = record?.schoolId;
  } else if (user.role === "student") {
    const record = await Student.findOne({ userId: user._id });
    schoolId = record?.schoolId;
  } else if (user.role === "accountant") {
    const record = await Accountant.findOne({ userId: user._id });
    schoolId = record?.schoolId;
  } else if (user.role === "librarian") {
    const record = await Librarian.findOne({ userId: user._id });
    schoolId = record?.schoolId;
  } else if (user.role === "parent") {
    const parentRecord = await Parent.findOne({ userId: user._id });
    if (parentRecord) {
      const studentRecord = await Student.findOne({ parentId: parentRecord._id });
      schoolId = studentRecord?.schoolId;
    }
  }

  if (schoolId) {
    const school = await School.findById(schoolId);
    if (school && school.suspendedAt) {
      return true;
    }
  }

  return false;
};
