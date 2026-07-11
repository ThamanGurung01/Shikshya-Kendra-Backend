import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAttendanceRecord {
  studentId: mongoose.Types.ObjectId;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  remarks?: string;
}

export interface IAttendance extends Document {
  schoolId: mongoose.Types.ObjectId;
  academicYearId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  date: Date;
  takenBy: mongoose.Types.ObjectId;
  records: IAttendanceRecord[];
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'],
      required: true,
      default: 'PRESENT',
    },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const attendanceSchema = new Schema<IAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    date: { type: Date, required: true },
    takenBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    records: { type: [attendanceRecordSchema], default: [] },
  },
  { timestamps: true }
);

// Compound index for quick lookup and enforcing one record per section per day
attendanceSchema.index({ schoolId: 1, classId: 1, sectionId: 1, date: 1 }, { unique: true });

export const Attendance =
  (mongoose.models.Attendance as Model<IAttendance>) ||
  mongoose.model<IAttendance>('Attendance', attendanceSchema);
