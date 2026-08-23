import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { currentUser, currentUserId } from '../middleware/auth.js';
import { getPayload, isSeller } from '../utils/http.js';
import { publicId, storePublicId, toObjectId } from '../utils/ids.js';
import { uploadImageBuffer } from '../services/cloudinaryUpload.js';

function serializeProduct(product, store) {
  return {
    id: publicId(product),
    restaurant_id: store ? publicId(store) : String(product.storeId),
    store_id: store ? storePublicId(store) : null,
    store_name: store?.nom || 'Boutique',
    nom: product.nom,
    description: product.description || '',
    prix: product.prix,
    image: product.image || '',
    category: product.category || 'restaurants',
    en_stock: Boolean(product.enStock),
    unit: product.unit || 'portion',
  };
}

async function ownerStore(userId) {
  return Store.findOne({ ownerId: userId });
}

export async function listAllProducts(_req, res) {
  const products = await Product.find().sort({ createdAt: -1 });
  const stores = await Store.find({ _id: { $in: products.map((p) => p.storeId) } });
  const storeMap = new Map(stores.map((store) => [String(store._id), store]));
  const mapped = products.map((product) => serializeProduct(product, storeMap.get(String(product.storeId))));
  return res.json({ products: mapped });
}

export async function listRestaurantProducts(req, res) {
  const restaurant = await ownerStore(currentUserId(req));
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant introuvable' });
  }
  const products = await Product.find({ storeId: restaurant._id }).sort({ createdAt: -1 });
  return res.json({ products: products.map((product) => serializeProduct(product, restaurant)) });
}

export async function createProduct(req, res) {
  try {
    const restaurant = await ownerStore(currentUserId(req));
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant introuvable.' });
    }

    const payload = getPayload(req);
    const nom = String(payload.nom || '').trim();
    const prix = Number(payload.prix || 0);
    if (!nom || !(prix > 0)) {
      return res.status(400).json({ success: false, message: 'Nom du produit et prix valides requis.' });
    }

    const product = await Product.create({
      storeId: restaurant._id,
      category: String(payload.category || '').trim() || 'restaurants',
      nom,
      description: String(payload.description || '').trim(),
      prix,
      image: String(payload.image || '').trim(),
      enStock: payload.en_stock == null ? true : String(payload.en_stock) !== 'false',
    });

    return res.status(201).json({
      success: true,
      message: 'Produit ajouté avec succès.',
      product: serializeProduct(product, restaurant),
    });
  } catch (error) {
    console.error('Product creation error:', error);
    return res.status(500).json({ success: false, message: 'Une erreur interne est survenue pendant la création du produit.' });
  }
}

export async function updateProduct(req, res) {
  const payload = getPayload(req);
  const productId = toObjectId(payload.id);
  if (!productId) {
    return res.status(400).json({ error: 'ID produit invalide' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }

  const restaurant = await ownerStore(currentUserId(req));
  if (!restaurant || String(restaurant._id) !== String(product.storeId)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const nom = String(payload.nom || '').trim();
  const prix = Number(payload.prix || 0);
  if (!nom || !(prix > 0)) {
    return res.status(400).json({ error: 'Nom du produit et prix valides requis.' });
  }

  product.category = String(payload.category || '').trim() || product.category;
  product.nom = nom;
  product.description = String(payload.description || '').trim();
  product.prix = prix;
  product.image = String(payload.image || '').trim();
  product.enStock = payload.en_stock == null ? true : String(payload.en_stock) !== 'false';
  await product.save();

  return res.json({ success: true, product: serializeProduct(product, restaurant) });
}

export async function deleteProduct(req, res) {
  const payload = getPayload(req);
  const productId = toObjectId(payload.id);
  if (!productId) {
    return res.status(400).json({ error: 'ID produit invalide' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }

  const restaurant = await ownerStore(currentUserId(req));
  if (!restaurant || String(restaurant._id) !== String(product.storeId)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  await product.deleteOne();
  return res.json({ success: true });
}

export async function uploadImage(req, res) {
  const role = currentUser(req)?.role;
  if (!isSeller(role) || !(await ownerStore(currentUserId(req)))) {
    return res.status(403).json({ error: 'Accès réservé aux vendeurs authentifiés', success: false });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Aucune image sélectionnée ou upload interrompu' });
  }

  try {
    const uploaded = await uploadImageBuffer(req.file.buffer, {
      folder: 'products',
      filename: req.file.originalname || 'product',
    });
    return res.json({ success: true, url: uploaded.url });
  } catch (error) {
    console.error('Product image upload error:', error);
    return res.status(503).json({ success: false, error: error.message || 'Impossible d’envoyer l’image du produit.' });
  }
}
