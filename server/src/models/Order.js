import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  unitPrice: Number,
  quantity: Number,
  subtotal: Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  clientName: { type: String, default: 'Client' },
  clientPhone: { type: String, default: '' },
  clientAddress: { type: String, required: true },
  clientLat: { type: Number, default: null },
  clientLng: { type: Number, default: null },
  storeName: { type: String, default: 'Boutique' },
  storeAddress: { type: String, default: '' },
  storeLat: { type: Number, default: null },
  storeLng: { type: Number, default: null },
  items: { type: [orderItemSchema], default: [] },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'momo_mtn', 'momo_moov', 'orange_money', 'celtis_cash'],
    default: 'cash',
  },
  paymentSource: { type: String, enum: ['direct_momo', 'wallet', 'cash'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  notes: { type: String, default: '' },
  cancellationReason: { type: String, default: null },
  delivery: {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['recherche', 'accepte', 'recupere', 'en_route', 'livre', null], default: null },
    distanceKm: { type: Number, default: null },
    startedAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
  },
  history: { type: [{ status: String, at: { type: Date, default: Date.now } }], default: [] },
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);
