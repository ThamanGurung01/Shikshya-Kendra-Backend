import mongoose, { Schema, Document } from 'mongoose';

export interface IMailRecipient {
  recipientId: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
}

export interface IMail extends Document {
  senderId: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  files: string[];
  recipients: IMailRecipient[];
  isDeletedBySender: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mailRecipientSchema = new Schema<IMailRecipient>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const mailSchema = new Schema<IMail>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    files: [{ type: String }],
    recipients: [mailRecipientSchema],
    isDeletedBySender: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Optimize performance for querying user inboxes/sent folders
mailSchema.index({ 'recipients.recipientId': 1, 'recipients.isDeleted': 1 });
mailSchema.index({ senderId: 1, isDeletedBySender: 1 });
mailSchema.index({ schoolId: 1 });

export const Mail = mongoose.model<IMail>('Mail', mailSchema);
