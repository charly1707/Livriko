import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  contact: { type: String, required: true, unique: true },
  contactType: { type: String, enum: ['email', 'whatsapp'], required: true },
  status: { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
}, { timestamps: true });

export const Newsletter = mongoose.model('Newsletter', newsletterSchema);
