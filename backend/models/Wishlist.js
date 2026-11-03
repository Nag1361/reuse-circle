import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true }
}, { timestamps: true });

schema.index({ userId: 1, listingId: 1 }, { unique: true });

export default mongoose.model('Wishlist', schema);
