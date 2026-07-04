import mongoose, { Document, Model, Schema } from 'mongoose';

export type RoutineDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface IPeriodConfig {
  position: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  label?: string;
}

export interface ISchoolScheduleConfig extends Document {
  schoolId: mongoose.Types.ObjectId;
  workingDays: RoutineDay[];
  periods: IPeriodConfig[];
}

const periodConfigSchema = new Schema<IPeriodConfig>(
  {
    position: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBreak: { type: Boolean, default: false },
    label: { type: String, default: '' },
  },
  { _id: false },
);

const schoolScheduleConfigSchema = new Schema<ISchoolScheduleConfig>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
    workingDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    }],
    periods: { type: [periodConfigSchema], default: [] },
  },
  { timestamps: true },
);

schoolScheduleConfigSchema.index({ schoolId: 1 }, { unique: true });

export const SchoolScheduleConfig =
  (mongoose.models.SchoolScheduleConfig as Model<ISchoolScheduleConfig>) ||
  mongoose.model<ISchoolScheduleConfig>('SchoolScheduleConfig', schoolScheduleConfigSchema);

export default SchoolScheduleConfig;