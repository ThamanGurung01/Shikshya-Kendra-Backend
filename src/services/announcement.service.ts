import { Announcement } from "../models/announcement.model";
import { AcademicYear } from "../models/academic-year.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { User } from "../models/user.model";
import { Parent } from "../models/parent.model";
import { Student } from "../models/student.model";
import { Types } from "mongoose";
import { IAnnouncementInput } from "../validators/announcement.validator";

export const createAnnouncement = async (
  schoolId: string,
  createdBy: string,
  data: IAnnouncementInput
) => {
  const announcement = await Announcement.create({
    title: data.title,
    content: data.content,
    audience: data.audience,
    showOnLogin: data.showOnLogin,
    loginMessageExpiry: data.loginMessageExpiry ? new Date(data.loginMessageExpiry) : null,
    targetClassId: data.targetClassId ? new Types.ObjectId(data.targetClassId) : null,
    targetSectionId: data.targetSectionId ? new Types.ObjectId(data.targetSectionId) : null,
    schoolId: new Types.ObjectId(schoolId),
    createdBy: new Types.ObjectId(createdBy),
  });

  return await Announcement.findById(announcement._id)
    .populate("createdBy", "name role profileImage")
    .populate("targetClassId", "name")
    .populate("targetSectionId", "name");
};

export const getAnnouncements = async (
  schoolId: string,
  userRole: string,
  userId: string,
  filters: {
    classId?: string | undefined;
    sectionId?: string | undefined;
    showOnLogin?: boolean | undefined;
    createdByMe?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  } = {}
) => {
  const query: any = { schoolId: new Types.ObjectId(schoolId) };

  if (filters.createdByMe) {
    query.createdBy = new Types.ObjectId(userId);
  }

  if (filters.showOnLogin !== undefined) {
    query.showOnLogin = filters.showOnLogin;
    if (filters.showOnLogin) {
      query.loginMessageExpiry = { $gt: new Date() };
    }
  }

  const isAdmin = ["superadmin", "oadmin", "admin"].includes(userRole);

  if (!filters.createdByMe && !isAdmin) {
    const conditions: any[] = [{ audience: "all" }];

    if (userRole === "teacher") {
      conditions.push({ audience: "teachers" });
      conditions.push({ createdBy: new Types.ObjectId(userId) });
    }

    const isStaff = ["accountant", "librarian"].includes(userRole);
    if (isStaff) {
      conditions.push({ audience: "staffs" });
    }

    const currentYear = await AcademicYear.findOne({
      schoolId: new Types.ObjectId(schoolId),
      isCurrent: true,
    });

    if (userRole === "student") {
      const studentRecord = await Student.findOne({ userId: new Types.ObjectId(userId) });
      if (studentRecord) {
        const enrollment = await StudentEnrollment.findOne({
          schoolId: new Types.ObjectId(schoolId),
          studentId: studentRecord._id,
          studentEnrollmentStatus: "active",
          ...(currentYear ? { academicYearId: currentYear._id } : {}),
        });

        const studentMatch: any = { audience: "students" };
        if (enrollment) {
          studentMatch.$or = [
            { targetClassId: null },
            {
              targetClassId: enrollment.classId,
              $or: [
                { targetSectionId: null },
                { targetSectionId: enrollment.sectionId },
              ],
            },
          ];
        } else {
          studentMatch.targetClassId = null;
        }
        conditions.push(studentMatch);
      }
    }

    if (userRole === "parent") {
      const parentRecord = await Parent.findOne({ userId: new Types.ObjectId(userId) });
      let classPairs: any[] = [];

      if (parentRecord) {
        // Find students associated with this parent
        const students = await Student.find({ parentId: parentRecord._id }).select("_id");
        const studentIds = students.map((s) => s._id);

        if (studentIds.length > 0) {
          const enrollments = await StudentEnrollment.find({
            schoolId: new Types.ObjectId(schoolId),
            studentId: { $in: studentIds },
            studentEnrollmentStatus: "active",
            ...(currentYear ? { academicYearId: currentYear._id } : {}),
          });
          classPairs = enrollments.map((env: any) => ({
            classId: env.classId,
            sectionId: env.sectionId,
          }));
        }
      }

      const parentMatch: any = { audience: "parents" };
      if (classPairs.length > 0) {
        parentMatch.$or = [
          { targetClassId: null },
          ...classPairs.map((pair: any) => ({
            targetClassId: pair.classId,
            $or: [
              { targetSectionId: null },
              { targetSectionId: pair.sectionId },
            ],
          })),
        ];
      } else {
        parentMatch.targetClassId = null;
      }
      conditions.push(parentMatch);
    }

    query.$or = conditions;
  }

  const page = filters.page ? parseInt(filters.page as any, 10) : undefined;
  const limit = filters.limit ? parseInt(filters.limit as any, 10) : undefined;

  let queryBuilder = Announcement.find(query)
    .populate("createdBy", "name role profileImage")
    .populate("targetClassId", "name")
    .populate("targetSectionId", "name")
    .sort({ createdAt: -1 });

  if (page !== undefined && limit !== undefined) {
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).limit(limit);
  }

  const announcements = await queryBuilder;
  const formatted = announcements.map((ann: any) => {
    const annObj = ann.toObject();
    const readBy = annObj.readBy || [];
    return {
      ...annObj,
      isRead: readBy.some((uid: any) => uid.toString() === userId.toString()),
    };
  });

  if (page !== undefined && limit !== undefined) {
    const totalCount = await Announcement.countDocuments(query);
    const hasMore = (page * limit) < totalCount;
    return {
      announcements: formatted,
      totalCount,
      hasMore,
      page,
      limit,
    };
  }

  return formatted;
};

export const updateAnnouncement = async (
  schoolId: string,
  announcementId: string,
  userId: string,
  userRole: string,
  data: any
) => {
  const announcement = await Announcement.findOne({
    _id: new Types.ObjectId(announcementId),
    schoolId: new Types.ObjectId(schoolId),
  });
  if (!announcement) throw new Error("Announcement not found");

  const isAdmin = ["superadmin", "oadmin", "admin"].includes(userRole);
  if (!isAdmin && announcement.createdBy.toString() !== userId) {
    throw new Error("Forbidden: You cannot modify this announcement");
  }

  if (data.title !== undefined) announcement.title = data.title;
  if (data.content !== undefined) announcement.content = data.content;
  if (data.audience !== undefined) announcement.audience = data.audience;
  if (data.showOnLogin !== undefined) announcement.showOnLogin = data.showOnLogin;
  if (data.loginMessageExpiry !== undefined) {
    announcement.loginMessageExpiry = data.loginMessageExpiry ? new Date(data.loginMessageExpiry) : null;
  }
  if (data.targetClassId !== undefined) {
    announcement.targetClassId = data.targetClassId ? new Types.ObjectId(data.targetClassId) : null;
  }
  if (data.targetSectionId !== undefined) {
    announcement.targetSectionId = data.targetSectionId ? new Types.ObjectId(data.targetSectionId) : null;
  }

  const saved = await announcement.save();
  return await Announcement.findById(saved._id)
    .populate("createdBy", "name role profileImage")
    .populate("targetClassId", "name")
    .populate("targetSectionId", "name");
};

export const deleteAnnouncement = async (
  schoolId: string,
  announcementId: string,
  userId: string,
  userRole: string
) => {
  const announcement = await Announcement.findOne({
    _id: new Types.ObjectId(announcementId),
    schoolId: new Types.ObjectId(schoolId),
  });
  if (!announcement) throw new Error("Announcement not found");

  const isAdmin = ["superadmin", "oadmin", "admin"].includes(userRole);
  if (!isAdmin && announcement.createdBy.toString() !== userId) {
    throw new Error("Forbidden: You cannot delete this announcement");
  }

  await Announcement.deleteOne({ _id: new Types.ObjectId(announcementId) });
  return announcement;
};

export const markAnnouncementAsRead = async (
  schoolId: string,
  announcementId: string,
  userId: string
) => {
  const announcement = await Announcement.findOne({
    _id: new Types.ObjectId(announcementId),
    schoolId: new Types.ObjectId(schoolId),
  });
  if (!announcement) throw new Error("Announcement not found");

  if (!announcement.readBy) {
    announcement.readBy = [];
  }

  const userIdStr = userId.toString();
  const alreadyRead = announcement.readBy.some((uid: any) => uid.toString() === userIdStr);

  if (!alreadyRead) {
    announcement.readBy.push(new Types.ObjectId(userId));
    await announcement.save();
  }

  return announcement;
};

export const markAllAnnouncementsAsRead = async (
  schoolId: string,
  userRole: string,
  userId: string
) => {
  const query: any = { schoolId: new Types.ObjectId(schoolId) };
  const isAdmin = ["superadmin", "oadmin", "admin"].includes(userRole);

  if (!isAdmin) {
    const conditions: any[] = [{ audience: "all" }];

    if (userRole === "teacher") {
      conditions.push({ audience: "teachers" });
      conditions.push({ createdBy: new Types.ObjectId(userId) });
    }

    const isStaff = ["accountant", "librarian"].includes(userRole);
    if (isStaff) {
      conditions.push({ audience: "staffs" });
    }

    const currentYear = await AcademicYear.findOne({
      schoolId: new Types.ObjectId(schoolId),
      isCurrent: true,
    });

    if (userRole === "student") {
      const studentRecord = await Student.findOne({ userId: new Types.ObjectId(userId) });
      if (studentRecord) {
        const enrollment = await StudentEnrollment.findOne({
          schoolId: new Types.ObjectId(schoolId),
          studentId: studentRecord._id,
          studentEnrollmentStatus: "active",
          ...(currentYear ? { academicYearId: currentYear._id } : {}),
        });

        const studentMatch: any = { audience: "students" };
        if (enrollment) {
          studentMatch.$or = [
            { targetClassId: null },
            {
              targetClassId: enrollment.classId,
              $or: [
                { targetSectionId: null },
                { targetSectionId: enrollment.sectionId },
              ],
            },
          ];
        } else {
          studentMatch.targetClassId = null;
        }
        conditions.push(studentMatch);
      }
    }

    if (userRole === "parent") {
      const parentRecord = await Parent.findOne({ userId: new Types.ObjectId(userId) });
      let classPairs: any[] = [];

      if (parentRecord) {
        const students = await Student.find({ parentId: parentRecord._id }).select("_id");
        const studentIds = students.map((s) => s._id);

        if (studentIds.length > 0) {
          const enrollments = await StudentEnrollment.find({
            schoolId: new Types.ObjectId(schoolId),
            studentId: { $in: studentIds },
            studentEnrollmentStatus: "active",
            ...(currentYear ? { academicYearId: currentYear._id } : {}),
          });
          classPairs = enrollments.map((env: any) => ({
            classId: env.classId,
            sectionId: env.sectionId,
          }));
        }
      }

      const parentMatch: any = { audience: "parents" };
      if (classPairs.length > 0) {
        parentMatch.$or = [
          { targetClassId: null },
          ...classPairs.map((pair: any) => ({
            targetClassId: pair.classId,
            $or: [
              { targetSectionId: null },
              { targetSectionId: pair.sectionId },
            ],
          })),
        ];
      } else {
        parentMatch.targetClassId = null;
      }
      conditions.push(parentMatch);
    }

    query.$or = conditions;
  }

  await Announcement.updateMany(
    { ...query, readBy: { $ne: new Types.ObjectId(userId) } },
    { $addToSet: { readBy: new Types.ObjectId(userId) } }
  );
};
