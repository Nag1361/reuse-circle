import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemRequest', required: true },
  type: { type: String, enum: ['request_rejected'], required: true },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  reason: { type: String, required: true, trim: true, maxlength: 1000 },
  readAt: { type: Date, default: null }
}, { timestamps: true });

schema.index({ requestId: 1, type: 1 }, { unique: true });
schema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Notification', schema);
