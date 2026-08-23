import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  category: { type: String, default: 'restaurants' },
  nom: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  prix: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  enStock: { type: Boolean, default: true },
  unit: { type: String, default: 'portion' },
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
