import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['client', 'restaurant', 'vendeur', 'livreur'], required: true },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: '' },
  messageType: { type: String, enum: ['text', 'image', 'emoji'], default: 'text' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  participants: { type: [participantSchema], default: [] },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);
