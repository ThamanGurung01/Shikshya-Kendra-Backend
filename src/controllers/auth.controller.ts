import {Request,Response} from "express";
import {User} from "../models/user.model";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/token.util";
import { zodError } from "../utils/zod-error.util";
import { LoginSchema, UpdateProfileContactSchema, ChangePasswordSchema } from "../validators/auth.validator";
import { resCookie } from "../utils/cookie.util";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { comparePassword, hashPassword } from "../utils/hash.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { checkSchoolSuspension } from "../utils/suspension.util";
import { Student } from "../models/student.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { Teacher } from "../models/teacher.model";
import { Admin } from "../models/admin.model";
import { School } from "../models/school.model";
import { Accountant } from "../models/accountant.model";
import { Librarian } from "../models/librarian.model";
import { Parent } from "../models/parent.model";
const AUTH_FAILED_MESSAGE = "Invalid email or password";

export const login=async(req:Request,res:Response)=>{
try{
  const parsed=LoginSchema.safeParse(req.body);
if(!parsed.success) {
  const tree=zodError(parsed.error);
  return sendError(res,"Validation failed",tree,400);}
const {email,password}=parsed.data;
const user=await User.findOne({email});
if(!user||!user.is_active) return sendError(res,AUTH_FAILED_MESSAGE,undefined,401);

const isSuspended = await checkSchoolSuspension(user);
if (isSuspended) {
  return sendError(res, "Your school has been suspended. Please contact administration.", undefined, 403);
}

const isMatch=await comparePassword(password,user.password);
if(!isMatch) return sendError(res,AUTH_FAILED_MESSAGE,undefined,401);
const token=generateAccessToken(user._id.toString());
const refreshToken=generateRefreshToken(user._id.toString());
user.refresh_token=refreshToken;
user.lastlogin=new Date();
await user.save();
resCookie(res,refreshToken,token);
return sendSuccess(res,"Login successful",{id:user._id,name:user.name,email:user.email,profileImage:user.profileImage,role:user.role});
}catch(error){  
  console.error("Login error:", error);
return sendError(res,"Authentication failed",undefined,500);
}
}
export const logout=async(req:Request,res:Response)=>{
try {
  const token = req.cookies.refreshToken;

  if (token) {
    if(!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    const decoded = verifyToken(token, process.env.REFRESH_TOKEN_SECRET);
    if(!decoded) throw new Error('Invalid refresh token');
    const user = await User.findById(decoded);

    if (user) {
      user.refresh_token = "";
      await user.save();
    }
  }
res.clearCookie('refreshToken');
res.clearCookie('accessToken');
return sendSuccess(res,"Logged out successfully");
} catch (error) {
  console.error("Logout error:", error);
  return sendError(res,"Server error",undefined,500);
}
}

export const authCheck=async (req:AuthenticatedRequest,res:Response)=>{
try {
  if (!req.userId) {
    return sendError(res,"Unauthorized",undefined,401);
  }
  const user = await User.findById(req.userId).select("-password -refresh_token");
  if (!user) {
    return sendError(res,"User not found",undefined,404);
  }
  if (user.role === "student" && !user.profileImage) {
    const student = await Student.findOne({ userId: user._id, deletedAt: null }).select("documents.photoUrl").lean();
    if (student?.documents?.photoUrl) {
      user.profileImage = student.documents.photoUrl;
      await User.findByIdAndUpdate(user._id, { $set: { profileImage: student.documents.photoUrl } });
    }
  }
  const isSuspended = await checkSchoolSuspension(user);
  if (isSuspended) {
    return sendError(res, "Your school has been suspended. Please contact administration.", undefined, 403);
  }
  return sendSuccess(res,"Authenticated",user);
} catch (error) {
  console.error("Auth check error:", error);
  return sendError(res,"Server error",undefined,500);
}
}

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendError(res, "Unauthorized", undefined, 401);
    }
    const user = await User.findById(req.userId).select("-password -refresh_token").lean();
    if (!user) {
      return sendError(res, "User not found", undefined, 404);
    }
    if (user.role === "superadmin") {
      return sendError(res, "Profile not supported for superadmin", undefined, 403);
    }

    let roleData: any = null;

    if (user.role === "student") {
      const student = await Student.findOne({ userId: user._id, deletedAt: null })
        .populate("schoolId", "school_name address contact logo school_email")
        .populate("parentId", "fatherName fatherPhone motherName motherPhone guardianName guardianPhone relation primarygurdianemail")
        .lean();

      if (!user.profileImage && student?.documents?.photoUrl) {
        user.profileImage = student.documents.photoUrl;
        User.findByIdAndUpdate(user._id, { $set: { profileImage: student.documents.photoUrl } }).exec();
      }

      let enrollment = null;
      if (student) {
        enrollment = await StudentEnrollment.findOne({
          studentId: student._id,
          studentEnrollmentStatus: "active",
        })
          .populate("classId", "name")
          .populate("sectionId", "name")
          .populate("academicYearId", "name")
          .lean();
      }

      roleData = {
        student,
        enrollment,
        contact: student?.contact || "",
        personalEmail: student?.student_email || "",
      };
    } else if (user.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: user._id, deletedAt: null })
        .populate("schoolId", "school_name address contact logo school_email")
        .lean();

      roleData = {
        teacher,
        contact: teacher?.contact || "",
        personalEmail: teacher?.teacher_email || "",
      };
    } else if (user.role === "admin") {
      const admin = await Admin.findOne({ userId: user._id, deletedAt: null })
        .populate("schoolId", "school_name address contact logo school_email")
        .lean();

      roleData = {
        admin,
        contact: admin?.contact || "",
        personalEmail: admin?.admin_email || "",
      };
    } else if (user.role === "oadmin") {
      const school = await School.findOne({ owner_id: user._id, deletedAt: null }).lean();

      roleData = {
        school,
        contact: school?.contact || "",
        personalEmail: school?.school_email || "",
      };
    } else if (user.role === "accountant") {
      const accountant = await Accountant.findOne({ userId: user._id, deletedAt: null })
        .populate("schoolId", "school_name address contact logo school_email")
        .lean();

      roleData = {
        accountant,
        contact: accountant?.contact || "",
        personalEmail: accountant?.accountant_email || "",
      };
    } else if (user.role === "librarian") {
      const librarian = await Librarian.findOne({ userId: user._id, deletedAt: null })
        .populate("schoolId", "school_name address contact logo school_email")
        .lean();

      roleData = {
        librarian,
        contact: librarian?.contact || "",
        personalEmail: librarian?.librarian_email || "",
      };
    } else if (user.role === "parent") {
      const parent = await Parent.findOne({ userId: user._id }).lean();
      let children: any[] = [];
      if (parent) {
        children = await Student.find({ parentId: parent._id, deletedAt: null })
          .populate("schoolId", "school_name")
          .lean();
      }

      roleData = {
        parent,
        children,
        contact: parent?.guardianPhone || parent?.fatherPhone || parent?.motherPhone || "",
        personalEmail: parent?.primarygurdianemail || "",
      };
    }

    return sendSuccess(res, "Profile retrieved successfully", {
      user,
      roleData,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return sendError(res, "Server error", undefined, 500);
  }
};

export const updateProfileContact = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendError(res, "Unauthorized", undefined, 401);
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, "User not found", undefined, 404);
    }
    if (user.role === "superadmin") {
      return sendError(res, "Profile updates not supported for superadmin", undefined, 403);
    }

    const parsed = UpdateProfileContactSchema.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, "Validation failed", tree, 400);
    }

    const { contact, email } = parsed.data;
    const updatePayload: Record<string, any> = {};

    if (user.role === "student") {
      if (contact !== undefined) updatePayload.contact = contact;
      if (email !== undefined) updatePayload.student_email = email;
      await Student.findOneAndUpdate({ userId: user._id }, updatePayload);
    } else if (user.role === "teacher") {
      if (contact !== undefined) updatePayload.contact = contact;
      if (email !== undefined) updatePayload.teacher_email = email;
      await Teacher.findOneAndUpdate({ userId: user._id }, updatePayload);
    } else if (user.role === "admin") {
      if (contact !== undefined) updatePayload.contact = contact;
      if (email !== undefined) updatePayload.admin_email = email;
      await Admin.findOneAndUpdate({ userId: user._id }, updatePayload);
    } else if (user.role === "oadmin") {
      if (contact !== undefined) updatePayload.contact = contact;
      if (email !== undefined) updatePayload.school_email = email;
      await School.findOneAndUpdate({ owner_id: user._id }, updatePayload);
    } else if (user.role === "accountant") {
      if (contact !== undefined) updatePayload.contact = contact;
      if (email !== undefined) updatePayload.accountant_email = email;
      await Accountant.findOneAndUpdate({ userId: user._id }, updatePayload);
    } else if (user.role === "librarian") {
      if (contact !== undefined) updatePayload.contact = contact;
      if (email !== undefined) updatePayload.librarian_email = email;
      await Librarian.findOneAndUpdate({ userId: user._id }, updatePayload);
    } else if (user.role === "parent") {
      if (contact !== undefined) updatePayload.guardianPhone = contact;
      if (email !== undefined) updatePayload.primarygurdianemail = email;
      await Parent.findOneAndUpdate({ userId: user._id }, updatePayload);
    }

    return sendSuccess(res, "Contact information updated successfully", {
      contact,
      email,
    });
  } catch (error) {
    console.error("Update profile contact error:", error);
    return sendError(res, "Server error", undefined, 500);
  }
};

export const updateProfileImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendError(res, "Unauthorized", undefined, 401);
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, "User not found", undefined, 404);
    }
    if (user.role === "superadmin") {
      return sendError(res, "Profile updates not supported for superadmin", undefined, 403);
    }
    if (user.role === "student") {
      return sendError(
        res,
        "Students are not allowed to update their profile picture. It can only be changed by school administration.",
        undefined,
        403
      );
    }

    const files = (req.files ?? {}) as { [fieldname: string]: Express.Multer.File[] };
    const uploadedFile = files.profileImage?.[0] || files.file?.[0] || files.image?.[0] || (req.file as any);
    const imageUrl = (uploadedFile as any)?.path || req.body?.profileImage || req.body?.imageUrl;

    if (!imageUrl) {
      return sendError(res, "No image file or URL provided", undefined, 400);
    }

    user.profileImage = imageUrl;
    await user.save();

    return sendSuccess(res, "Profile image updated successfully", {
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("Update profile image error:", error);
    return sendError(res, "Server error", undefined, 500);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendError(res, "Unauthorized", undefined, 401);
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, "User not found", undefined, 404);
    }
    if (user.role === "superadmin") {
      return sendError(res, "Password change through this setting is not allowed for superadmin", undefined, 403);
    }

    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, "Validation failed", tree, 400);
    }

    const { currentPassword, newPassword } = parsed.data;

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, "Current password is incorrect", undefined, 400);
    }

    if (currentPassword === newPassword) {
      return sendError(res, "New password must be different from current password", undefined, 400);
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return sendSuccess(res, "Password updated successfully");
  } catch (error) {
    console.error("Change password error:", error);
    return sendError(res, "Server error", undefined, 500);
  }
};