import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemRequest', default: null },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentReport', default: null },
  type: {
    type: String,
    enum: ['request_rejected', 'listing_reported', 'report_reviewed', 'report_dismissed'],
    required: true
  },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  reason: { type: String, trim: true, maxlength: 1000, default: '' },
  readAt: { type: Date, default: null }
}, { timestamps: true });

schema.index(
  { requestId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { requestId: { $type: 'objectId' } }
  }
);
schema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Notification', schema);
