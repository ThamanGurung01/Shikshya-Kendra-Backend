import mongoose from "mongoose";
import { Mail } from "../models/mail.model";
import { User } from "../models/user.model";
import { Student } from "../models/student.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { AcademicYear } from "../models/academic-year.model";
import { ClassModel } from "../models/class.model";
import { SectionModel } from "../models/section.model";
import { School } from "../models/school.model";
import { Admin } from "../models/admin.model";
import { Teacher } from "../models/teacher.model";
import { Librarian } from "../models/librarian.model";
import { Accountant } from "../models/accountant.model";
import { Parent } from "../models/parent.model";
import { notifyUserMailUpdate } from "../configs/socket";

export const getUnreadCount = async (userId: string) => {
  return await Mail.countDocuments({
    recipients: {
      $elemMatch: {
        recipientId: userId,
        isDeleted: false,
        isRead: false,
      },
    },
  });
};

export const sendMailService = async (
  schoolId: string,
  senderId: string,
  senderRole: string,
  payload: any,
) => {
  if (senderRole === "superadmin") {
    throw new Error("Super admins cannot send mails.");
  }

  const { targetType, title, description, files } = payload;
  let resolvedIds: string[] = [];

  if (targetType === "individuals") {
    if (!payload.recipientIds || payload.recipientIds.length === 0) {
      throw new Error("No recipients specified");
    }
    const users = await User.find({
      _id: { $in: payload.recipientIds },
    }).select("_id role");
    resolvedIds = users.map((u: any) => u._id.toString());
  } else if (targetType === "roles") {
    const isAdmin = ["oadmin", "admin"].includes(senderRole);
    const isTeacher = senderRole === "teacher";
    if (!isAdmin && !isTeacher) {
      throw new Error("You do not have permission to send mail to roles");
    }

    if (!payload.roles || payload.roles.length === 0) {
      throw new Error("No roles specified");
    }

    const roleTargets: string[] = [];
    payload.roles.forEach((r: string) => {
      if (r === "@everyone") {
        roleTargets.push(
          "oadmin",
          "admin",
          "teacher",
          "student",
          "accountant",
          "librarian",
          "parent",
        );
      } else if (r === "@teachers") {
        roleTargets.push("teacher");
      } else if (r === "@students") {
        roleTargets.push("student");
      } else if (r === "@librarians") {
        roleTargets.push("librarian");
      } else if (r === "@accountant") {
        roleTargets.push("accountant");
      } else if (r === "@parents") {
        roleTargets.push("parent");
      } else {
        roleTargets.push(r);
      }
    });

    let finalRoles = [...new Set(roleTargets)];
    if (isTeacher) {
      finalRoles = finalRoles.filter((r) => r === "student" || r === "parent");
    }

    const users = await User.find({
      role: { $in: finalRoles },
    }).select("_id");

    const schoolUserIds: string[] = [];
    const userIds = users.map((u: any) => u._id.toString());

    // Get admins in school
    if (finalRoles.includes("admin") || finalRoles.includes("oadmin")) {
      const admins = await Admin.find({
        schoolId,
        userId: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
      }).select("userId");
      admins.forEach((a: any) => schoolUserIds.push(a.userId.toString()));
    }

    // Get teachers in school
    if (finalRoles.includes("teacher")) {
      const teachers = await Teacher.find({
        schoolId,
        userId: {
          $in: userIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        },
      }).select("userId");
      teachers.forEach((t: any) => schoolUserIds.push(t.userId.toString()));
    }

    // Get librarians in school
    if (finalRoles.includes("librarian")) {
      const librarians = await Librarian.find({
        schoolId,
        userId: {
          $in: userIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        },
      }).select("userId");
      librarians.forEach((l: any) => schoolUserIds.push(l.userId.toString()));
    }

    // Get accountants in school
    if (finalRoles.includes("accountant")) {
      const accountants = await Accountant.find({
        schoolId,
        userId: {
          $in: userIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        },
      }).select("userId");
      accountants.forEach((a: any) => schoolUserIds.push(a.userId.toString()));
    }

    // Get students in school
    if (finalRoles.includes("student")) {
      const students = await Student.find({
        schoolId,
        userId: {
          $in: userIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        },
      }).select("userId");
      students.forEach((s: any) => schoolUserIds.push(s.userId.toString()));
    }

    // Get parents in school (via students linked to parents)
    if (finalRoles.includes("parent")) {
      const parents = await Parent.find({
        userId: {
          $in: userIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        },
      }).select("_id userId");
      for (const parent of parents) {
        const student = await Student.findOne({
          parentId: parent._id,
          schoolId,
        }).select("_id");
        if (student) {
          schoolUserIds.push(parent.userId.toString());
        }
      }
    }

    resolvedIds = [...new Set(schoolUserIds)];
  } else if (targetType === "classes" || targetType === "sections") {
    const isAdmin = ["oadmin", "admin"].includes(senderRole);
    const isTeacher = senderRole === "teacher";
    if (!isAdmin && !isTeacher) {
      throw new Error(
        "You do not have permission to send mail to classes/sections",
      );
    }

    const currentYear = await AcademicYear.findOne({
      schoolId,
      isCurrent: true,
    });
    const query: any = {
      schoolId: new mongoose.Types.ObjectId(schoolId),
      studentEnrollmentStatus: "active",
    };
    if (currentYear) {
      query.academicYearId = currentYear._id;
    }

    if (targetType === "classes") {
      if (!payload.classIds || payload.classIds.length === 0) {
        throw new Error("No classes specified");
      }
      query.classId = {
        $in: payload.classIds.map(
          (id: string) => new mongoose.Types.ObjectId(id),
        ),
      };
    } else {
      if (!payload.sectionIds || payload.sectionIds.length === 0) {
        throw new Error("No sections specified");
      }
      query.sectionId = {
        $in: payload.sectionIds.map(
          (id: string) => new mongoose.Types.ObjectId(id),
        ),
      };
    }

    const enrollments = await StudentEnrollment.find(query).select("studentId");
    const studentDocIds = enrollments.map((e: any) => e.studentId.toString());

    // Resolve studentId -> userId
    const students = await Student.find({ _id: { $in: studentDocIds } }).select(
      "userId",
    );
    resolvedIds = students.map((s: any) => s.userId.toString());
  }

  // Filter out sender and ensure uniqueness
  resolvedIds = resolvedIds.filter((id) => id !== senderId.toString());
  resolvedIds = [...new Set(resolvedIds)];

  if (resolvedIds.length === 0) {
    throw new Error("No valid recipients found");
  }

  // Fetch details of all resolved recipients to apply safety rules
  const recipientUsers = await User.find({ _id: { $in: resolvedIds } }).select(
    "role",
  );
  const recipientRoles = recipientUsers.map((u: any) => u.role);

  if (senderRole === "student") {
    if (resolvedIds.length > 1) {
      throw new Error("Students can only send mail to a single recipient");
    }
    if (recipientRoles.includes("parent")) {
      throw new Error("Students cannot send mail to parents");
    }
  }

  if (senderRole === "parent") {
    if (resolvedIds.length > 1) {
      throw new Error("Parents can only send mail to a single recipient");
    }
    if (
      recipientRoles.includes("student") ||
      recipientRoles.includes("parent")
    ) {
      throw new Error("Parents cannot send mail to students or other parents");
    }
  }

  if (senderRole === "librarian" || senderRole === "accountant") {
    if (resolvedIds.length > 1) {
      throw new Error(
        "Librarians and Accountants can only send mail to a single recipient",
      );
    }
  }

  if (senderRole === "teacher") {
    const hasNonStudentParent = recipientUsers.some(
      (u: any) => u.role !== "student" && u.role !== "parent",
    );
    if (hasNonStudentParent && resolvedIds.length > 1) {
      throw new Error(
        "Teachers can only send to a single recipient when messaging staff/admins",
      );
    }
  }

  const recipients = resolvedIds.map((rId) => ({
    recipientId: new mongoose.Types.ObjectId(rId),
    isRead: false,
    isDeleted: false,
  }));

  const mail = new Mail({
    senderId,
    schoolId,
    title,
    description,
    files,
    recipients,
  });

  const saved = await mail.save();

  // Populate sender info for the response
  const populated = await Mail.findById(saved._id)
    .populate("senderId", "name role profileImage email")
    .populate("recipients.recipientId", "name role profileImage email");

  // Fire-and-forget real-time socket counts to active recipients
  for (const rId of resolvedIds) {
    try {
      const count = await getUnreadCount(rId);
      notifyUserMailUpdate(rId, count);
    } catch (err) {
      console.error(`Socket notification failed for ${rId}`, err);
    }
  }

  return populated;
};

export const getInboxService = async (
  schoolId: string,
  userId: string,
  page: number = 1,
  limit: number = 20,
) => {
  const query = {
    schoolId,
    recipients: {
      $elemMatch: {
        recipientId: userId,
        isDeleted: false,
      },
    },
  };

  const skip = (page - 1) * limit;

  const mails = await Mail.find(query)
    .populate("senderId", "name role profileImage email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Mail.countDocuments(query);
  const hasMore = page * limit < totalCount;

  const formatted = mails.map((m: any) => {
    const mailObj = m.toObject();
    const recipient = mailObj.recipients.find(
      (r: any) => r.recipientId.toString() === userId.toString(),
    );
    return {
      ...mailObj,
      isRead: recipient ? recipient.isRead : false,
      readAt: recipient ? recipient.readAt : null,
    };
  });

  return {
    mails: formatted,
    totalCount,
    hasMore,
    page,
    limit,
  };
};

export const getSentService = async (
  schoolId: string,
  userId: string,
  page: number = 1,
  limit: number = 20,
) => {
  const query = {
    schoolId,
    senderId: userId,
    isDeletedBySender: false,
  };

  const skip = (page - 1) * limit;

  const mails = await Mail.find(query)
    .populate("recipients.recipientId", "name role profileImage email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Mail.countDocuments(query);
  const hasMore = page * limit < totalCount;

  return {
    mails,
    totalCount,
    hasMore,
    page,
    limit,
  };
};

export const getMailByIdService = async (
  schoolId: string,
  userId: string,
  mailId: string,
) => {
  const mail = await Mail.findOne({
    _id: mailId,
    schoolId,
    $or: [
      { senderId: userId, isDeletedBySender: false },
      {
        recipients: {
          $elemMatch: {
            recipientId: userId,
            isDeleted: false,
          },
        },
      },
    ],
  })
    .populate("senderId", "name role profileImage email")
    .populate("recipients.recipientId", "name role profileImage email");

  if (!mail) {
    throw new Error("Mail not found");
  }

  const recipientIndex = mail.recipients.findIndex((r: any) => {
    const rId = r.recipientId?._id || r.recipientId;
    return rId?.toString() === userId.toString();
  });

  if (recipientIndex > -1) {
    const recipient = mail.recipients[recipientIndex];
    if (recipient && !recipient.isRead) {
      recipient.isRead = true;
      recipient.readAt = new Date();
      await mail.save();

      try {
        const count = await getUnreadCount(userId);
        notifyUserMailUpdate(userId, count);
      } catch (err) {
        console.error(`Socket update failed for user ${userId}`, err);
      }
    }
  }

  const mailObj = mail.toObject();
  const recipient = mailObj.recipients.find((r: any) => {
    const rId = r.recipientId?._id || r.recipientId;
    return rId?.toString() === userId.toString();
  });

  return {
    ...mailObj,
    isRead: recipient ? recipient.isRead : false,
    readAt: recipient ? recipient.readAt : null,
  };
};

export const markAllAsReadService = async (
  schoolId: string,
  userId: string,
) => {
  await Mail.updateMany(
    {
      schoolId,
      recipients: {
        $elemMatch: {
          recipientId: userId,
          isDeleted: false,
          isRead: false,
        },
      },
    },
    {
      $set: {
        "recipients.$[elem].isRead": true,
        "recipients.$[elem].readAt": new Date(),
      },
    },
    {
      arrayFilters: [{ "elem.recipientId": userId }],
    },
  );

  try {
    const count = await getUnreadCount(userId);
    notifyUserMailUpdate(userId, count);
  } catch (err) {
    console.error(`Socket update failed for user ${userId}`, err);
  }
};

export const deleteMailService = async (
  schoolId: string,
  userId: string,
  mailId: string,
) => {
  const mail = await Mail.findOne({
    _id: mailId,
    schoolId,
    $or: [{ senderId: userId }, { "recipients.recipientId": userId }],
  });

  if (!mail) {
    throw new Error("Mail not found");
  }

  let modified = false;

  if (mail.senderId.toString() === userId.toString()) {
    mail.isDeletedBySender = true;
    modified = true;
  }

  const recipientIndex = mail.recipients.findIndex((r: any) => {
    const rId = r.recipientId?._id || r.recipientId;
    return rId?.toString() === userId.toString();
  });
  if (recipientIndex > -1) {
    const recipient = mail.recipients[recipientIndex];
    if (recipient) {
      recipient.isDeleted = true;
      modified = true;
    }
  }

  if (modified) {
    await mail.save();
  }

  const allRecipientsDeleted = mail.recipients.every((r: any) => r.isDeleted);
  if (mail.isDeletedBySender && allRecipientsDeleted) {
    await Mail.deleteOne({ _id: mail._id });
  }

  try {
    const count = await getUnreadCount(userId);
    notifyUserMailUpdate(userId, count);
  } catch (err) {
    console.error(`Socket update failed for user ${userId}`, err);
  }

  return mail;
};

export const getRecipientMetaService = async (schoolId: string) => {
  const classes = await ClassModel.find({ schoolId })
    .select("_id name")
    .sort({ name: 1 });
  const classIds = classes.map((c: any) => c._id);
  const sections = await SectionModel.find({
    schoolId: new mongoose.Types.ObjectId(schoolId),
    classId: { $in: classIds },
  })
    .select("_id classId name")
    .sort({ name: 1 });

  const roles = [
    { label: "Everyone", value: "@everyone" },
    { label: "Teachers", value: "@teachers" },
    { label: "Students", value: "@students" },
    { label: "Librarians", value: "@librarians" },
    { label: "Accountants", value: "@accountant" },
    { label: "Parents", value: "@parents" },
  ];
  return { classes, sections, roles };
};

export const searchRecipientsService = async (
  schoolId: string,
  queryText: string,
  senderId: string,
  senderRole: string,
) => {
  const searchRegex = new RegExp(queryText, "i");
  const query: any = {
    _id: { $ne: senderId },
    $or: [{ name: searchRegex }, { email: searchRegex }],
  };

  if (senderRole === "student") {
    query.role = { $ne: "parent" };
  } else if (senderRole === "parent") {
    query.role = { $nin: ["student", "parent"] };
  }

  // Get users and filter by school membership
  const users = await User.find(query)
    .select("_id name email role profileImage")
    .limit(100);

  // Filter to only users in the same school

  const schoolUserIdSet = new Set<string>();

  // Check each role category
  const userIds = users.map((u: any) => u._id);

  const [admins, teachers, students, librarians, accountants, parents] =
    await Promise.all([
      Admin.find({ schoolId, userId: { $in: userIds } }).select("userId"),
      Teacher.find({ schoolId, userId: { $in: userIds } }).select("userId"),
      Student.find({ schoolId, userId: { $in: userIds } }).select("userId"),
      Librarian.find({ schoolId, userId: { $in: userIds } }).select("userId"),
      Accountant.find({ schoolId, userId: { $in: userIds } }).select("userId"),
      Parent.find({ userId: { $in: userIds } }).select("_id userId"),
    ]);

  admins.forEach((a: any) => schoolUserIdSet.add(a.userId.toString()));
  teachers.forEach((t: any) => schoolUserIdSet.add(t.userId.toString()));
  students.forEach((s: any) => schoolUserIdSet.add(s.userId.toString()));
  librarians.forEach((l: any) => schoolUserIdSet.add(l.userId.toString()));
  accountants.forEach((a: any) => schoolUserIdSet.add(a.userId.toString()));

  // For parents, verify they have a student in this school
  for (const parent of parents) {
    const studentInSchool = await Student.findOne({
      parentId: parent._id,
      schoolId,
    });
    if (studentInSchool) {
      schoolUserIdSet.add(parent.userId.toString());
    }
  }

  // Also include oadmin if school matches
  const school = await School.findById(schoolId).select("owner_id");
  if (school?.owner_id) {
    schoolUserIdSet.add(school.owner_id.toString());
  }

  return users
    .filter((u: any) => schoolUserIdSet.has(u._id.toString()))
    .slice(0, 50);
};
