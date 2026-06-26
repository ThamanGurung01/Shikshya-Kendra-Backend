import { model, Schema, Types } from 'mongoose';

export interface IAdmin {
  employeeId: string;
  adminName: string;
  address: string;
  gender: string;
  contact: string;
  dob: Date;
  admin_email?: string;
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'active' | 'inactive';
  qualification?: string;
  joinDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const adminSchema = new Schema<IAdmin>(
  {
    adminName: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    gender: { type: String, required: true },
    contact: { type: String, required: true },
    dob: { type: Date, required: true },
    admin_email: { type: String },
    schoolId: { type: Types.ObjectId, ref: 'School', required: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    qualification: { type: String },
    joinDate: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
);

export const Admin = model<IAdmin>('Admin', adminSchema);
