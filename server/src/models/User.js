import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['client', 'restaurant', 'vendeur', 'livreur', 'admin', 'administrateur'],
    default: 'client',
  },
  nom: { type: String, required: true, trim: true },
  prenom: { type: String, required: true, trim: true },
  nomUtilisateur: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  motDePasse: { type: String, required: true },
  telephone: { type: String, required: true, trim: true },
  avatar: { type: String, default: null },
  statut: { type: String, enum: ['actif', 'inactif', 'suspendu', 'bloque'], default: 'actif' },
  vehicle: { type: String, default: null },
  city: { type: String, default: 'Lokossa' },
  documentsValide: { type: Boolean, default: false },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'incomplete', null],
    default: null,
  },
  rejectionReason: { type: String, default: null },
  selfiePhoto: { type: String, default: null },
  cipPhoto: { type: String, default: null },
  vehiclePhoto: { type: String, default: null },
  vehiclePlate: { type: String, default: null },
  walletBalance: { type: Number, default: 0 },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  address: { type: String, default: '' },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
