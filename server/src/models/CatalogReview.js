import mongoose from 'mongoose';

const catalogReviewSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['store', 'product'], required: true, index: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: null, trim: true, maxlength: 1000 },
}, { timestamps: true });

catalogReviewSchema.index({ targetType: 1, targetId: 1, clientId: 1 }, { unique: true });

export const CatalogReview = mongoose.model('CatalogReview', catalogReviewSchema);
