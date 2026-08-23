import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  nom: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  adresse: { type: String, required: true },
  ville: { type: String, default: 'Lokossa' },
  telephone: { type: String, required: true },
  momoPhone: { type: String, default: null },
  logo: { type: String, default: null },
  category: { type: String, default: 'restaurants' },
  statut: { type: String, enum: ['approuve', 'en_attente', 'suspendu'], default: 'approuve' },
  estCertifie: { type: Boolean, default: false },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
}, { timestamps: true });

export const Store = mongoose.model('Store', storeSchema);
