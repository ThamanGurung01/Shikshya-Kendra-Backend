import { School } from '../models/school.model';
import { Student } from '../models/student.model';
import { Parent } from '../models/parent.model';
import { Teacher } from '../models/teacher.model';
import { Accountant } from '../models/accountant.model';
import { Librarian } from '../models/librarian.model';
import { Admin } from '../models/admin.model';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/hash.util';
import { Types } from 'mongoose';

export const getSuperadminDashboardStats = async () => {
  // 1. Overall counts across entire system
  const [
    totalSchools,
    activeSchools,
    suspendedSchools,
    totalStudents,
    totalParents,
    totalTeachers,
    totalAccountants,
    totalLibrarians,
    totalAdmins,
    totalUsers,
  ] = await Promise.all([
    School.countDocuments({ deletedAt: null }),
    School.countDocuments({ verifiedAt: { $ne: null }, suspendedAt: null, deletedAt: null }),
    School.countDocuments({ suspendedAt: { $ne: null }, deletedAt: null }),
    Student.countDocuments({ deletedAt: null }),
    Parent.countDocuments({ deletedAt: null }),
    Teacher.countDocuments({ deletedAt: null }),
    Accountant.countDocuments({ deletedAt: null }),
    Librarian.countDocuments({ deletedAt: null }),
    Admin.countDocuments({ deletedAt: null }),
    User.countDocuments({ deletedAt: null }),
  ]);

  const totalStaff = totalAccountants + totalLibrarians + totalAdmins;

  // 2. Role distribution breakdown
  const roleCountsRaw = await User.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  const roleDistribution: Record<string, number> = {
    superadmin: 0,
    oadmin: 0,
    admin: 0,
    teacher: 0,
    student: 0,
    parent: 0,
    librarian: 0,
    accountant: 0,
  };

  roleCountsRaw.forEach((item) => {
    if (item._id) {
      roleDistribution[item._id] = item.count;
    }
  });

  // 3. Per school metrics breakdown
  const schools = await School.find({ deletedAt: null })
    .populate('owner_id', 'name email role is_active lastlogin')
    .sort({ createdAt: -1 });

  // Get student, teacher, staff counts grouped by schoolId
  const [studentCounts, teacherCounts, accountantCounts, librarianCounts, adminCounts] = await Promise.all([
    Student.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$schoolId', count: { $sum: 1 } } },
    ]),
    Teacher.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$schoolId', count: { $sum: 1 } } },
    ]),
    Accountant.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$schoolId', count: { $sum: 1 } } },
    ]),
    Librarian.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$schoolId', count: { $sum: 1 } } },
    ]),
    Admin.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$schoolId', count: { $sum: 1 } } },
    ]),
  ]);

  const toMap = (arr: any[]) =>
    arr.reduce((acc, curr) => {
      if (curr._id) acc[curr._id.toString()] = curr.count;
      return acc;
    }, {} as Record<string, number>);

  const studentMap = toMap(studentCounts);
  const teacherMap = toMap(teacherCounts);
  const accountantMap = toMap(accountantCounts);
  const librarianMap = toMap(librarianCounts);
  const adminMap = toMap(adminCounts);

  const schoolDetails = schools.map((school) => {
    const sId = school._id.toString();
    const students = studentMap[sId] || 0;
    const teachers = teacherMap[sId] || 0;
    const accountants = accountantMap[sId] || 0;
    const librarians = librarianMap[sId] || 0;
    const admins = adminMap[sId] || 0;
    const staff = accountants + librarians + admins;

    const owner: any = school.owner_id;

    return {
      _id: school._id,
      school_name: school.school_name,
      slug: school.slug,
      school_email: school.school_email,
      contact: school.contact,
      address: school.address,
      logo: school.logo,
      verifiedAt: school.verifiedAt,
      suspendedAt: school.suspendedAt,
      createdAt: school.createdAt,
      principal: owner
        ? {
            userId: owner._id,
            name: owner.name,
            email: owner.email,
            role: owner.role,
            is_active: owner.is_active,
            lastlogin: owner.lastlogin,
          }
        : null,
      studentCount: students,
      teacherCount: teachers,
      staffCount: staff,
      accountantCount: accountants,
      librarianCount: librarians,
      adminCount: admins,
    };
  });

  return {
    overview: {
      totalSchools,
      activeSchools,
      suspendedSchools,
      pendingSchools: totalSchools - activeSchools - suspendedSchools,
      totalStudents,
      totalParents,
      totalTeachers,
      totalAccountants,
      totalLibrarians,
      totalAdmins,
      totalStaff,
      totalUsers,
    },
    roleDistribution,
    schoolDetails,
  };
};

export const resetPrincipalPassword = async (userId: string, newPassword: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid User ID');
  }

  if (!newPassword || newPassword.trim().length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (!['oadmin', 'admin', 'superadmin'].includes(user.role)) {
    throw new Error('Selected user is not a school principal or administrator');
  }

  const hashedPassword = await hashPassword(newPassword.trim());

  user.password = hashedPassword;
  user.refresh_token = '';
  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};
