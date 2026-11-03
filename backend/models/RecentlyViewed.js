import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  viewedAt: { type: Date, default: Date.now, index: true }
});

schema.index({ userId: 1, listingId: 1 }, { unique: true });
schema.index({ userId: 1, viewedAt: -1 });

export default mongoose.model('RecentlyViewed', schema);
