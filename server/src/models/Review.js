import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: null },
  reasons: { type: [String], default: [] },
}, { timestamps: true });

const deliveryReportSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String, required: true },
  description: { type: String, default: null },
}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);
export const DeliveryReport = mongoose.model('DeliveryReport', deliveryReportSchema);
