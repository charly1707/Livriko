import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, required: true },
  providerTransactionId: { type: String, default: null },
  idempotencyKey: { type: String, required: true, unique: true },
  customerPhone: { type: String, default: null },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XOF' },
  status: { type: String, enum: ['pending', 'successful', 'failed', 'cancelled'], default: 'pending' },
  providerPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  failureReason: { type: String, default: null },
}, { timestamps: true });

const webhookEventSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  eventId: { type: String, required: true },
  signatureValid: { type: Boolean, default: false },
  payload: { type: mongoose.Schema.Types.Mixed, default: null },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
