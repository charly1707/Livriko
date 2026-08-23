import mongoose from 'mongoose';

const serviceExpressSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  livreurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, required: true },
  description: { type: String, required: true },
  fromName: { type: String, default: null },
  fromAddress: { type: String, required: true },
  fromPhone: { type: String, default: null },
  fromNotes: { type: String, default: null },
  toName: { type: String, default: null },
  toAddress: { type: String, required: true },
  toPhone: { type: String, default: null },
  toNotes: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  distanceKm: { type: Number, required: true },
  fee: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'searching', 'assigned', 'to_pickup', 'picked_up', 'delivering', 'delivered', 'completed', 'cancelled'],
    default: 'searching',
  },
  completedAt: { type: Date, default: null },
  history: { type: [{ status: String, at: { type: Date, default: Date.now } }], default: [] },
}, { timestamps: true });

export const ServiceExpress = mongoose.model('ServiceExpress', serviceExpressSchema);
