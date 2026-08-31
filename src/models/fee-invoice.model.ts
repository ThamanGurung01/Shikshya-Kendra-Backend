import { Schema, model, Types } from "mongoose";

export interface IReceiptItem {
  title: string; // e.g. "Monthly Tuition Fee - Baishakh", "Exam Fee", "Transport Fee"
  month?: number | undefined; // Month index (1-12) if applicable
  feeHeadId?: Types.ObjectId | undefined;
  amount: number;
}

export interface IFeeInvoice {
  receiptNumber: string; // Unique human-readable receipt code: e.g. REC-202605-00101
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId?: Types.ObjectId | undefined;
  paidMonths: number[]; // Months covered by this payment (e.g. [1, 2] for Baishakh & Jestha)
  items: IReceiptItem[]; // Itemized breakdown of fees paid
  subTotal: number;
  discountAmount: number; // Flat or percentage discount applied
  proRatioWaiver: number; // Any holiday/closure pro-rated waiver deducted
  proRatioReason?: string | undefined; // e.g. "Winter break half-month waiver"
  totalAmount: number; // Final net payable for this transaction
  paidAmount: number; // Amount actually received
  dueAmount: number; // Remaining due on these items (if partial payment)
  paymentMethod: "cash" | "cheque" | "bank_transfer" | "esewa";
  paymentReference?: string | undefined; // Cheque #, Bank deposit slip #, or eSewa ref_id
  paymentDate: Date;
  status: "paid" | "partially_paid";
  remarks?: string | undefined;
  collectedBy?: Types.ObjectId | undefined; // Accountant/Admin user ID (null if paid online)
  incomeId?: Types.ObjectId | undefined; // Linked Income ledger entry
  deletedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const receiptItemSchema = new Schema<IReceiptItem>(
  {
    title: { type: String, required: true },
    month: { type: Number, min: 1, max: 12 },
    feeHeadId: { type: Schema.Types.ObjectId, ref: "FeeHead" },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const feeInvoiceSchema = new Schema<IFeeInvoice>(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
    paidMonths: [{ type: Number }],
    items: [receiptItemSchema],
    subTotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    proRatioWaiver: { type: Number, default: 0, min: 0 },
    proRatioReason: { type: String, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "cheque", "bank_transfer", "esewa"],
      default: "cash",
    },
    paymentReference: { type: String, trim: true },
    paymentDate: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["paid", "partially_paid"],
      default: "paid",
    },
    remarks: { type: String, trim: true },
    collectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    incomeId: { type: Schema.Types.ObjectId, ref: "Income" },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

feeInvoiceSchema.index({ schoolId: 1, studentId: 1, academicYearId: 1 });
feeInvoiceSchema.index({ schoolId: 1, paymentDate: -1 });

export const FeeInvoice = model<IFeeInvoice>("FeeInvoice", feeInvoiceSchema);
