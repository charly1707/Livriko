import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { currentUserId } from '../middleware/auth.js';
import { getPayload, isSeller } from '../utils/http.js';
import { publicId, toObjectId } from '../utils/ids.js';
import { defaultStoreCoordinates } from '../utils/geo.js';
import { getReviewStatsMap } from './catalogReviewController.js';

function serializeStore(restaurant) {
  return {
    id: publicId(restaurant),
    name: restaurant.nom,
    ownerId: String(restaurant.ownerId),
    address: restaurant.adresse,
    city: restaurant.ville,
    phone: restaurant.telephone,
    momoPhone: restaurant.momoPhone,
    logo: restaurant.logo,
    category: restaurant.category || 'restaurants',
    isOpen: restaurant.statut === 'approuve',
    isCertified: Boolean(restaurant.estCertifie),
    description: restaurant.description,
    lat: restaurant.lat,
    lng: restaurant.lng,
  };
}

export async function listStores(_req, res) {
  try {
    const restaurants = await Store.find({ statut: { $ne: 'suspendu' } }).sort({ createdAt: -1 });
    const storeIds = restaurants.map((restaurant) => restaurant._id);
    const products = await Product.find({ storeId: { $in: storeIds }, image: { $nin: [null, ''] } })
      .select('storeId image')
      .sort({ createdAt: -1 });

    const fallbackLogoByStoreId = new Map();
    for (const product of products) {
      const key = String(product.storeId);
      if (!fallbackLogoByStoreId.has(key) && product.image) {
        fallbackLogoByStoreId.set(key, product.image);
      }
    }

    const statsMap = await getReviewStatsMap('store', storeIds);

    return res.json({
      success: true,
      restaurants: restaurants.map((restaurant) => {
        const serialized = serializeStore(restaurant);
        if (!serialized.logo) {
          serialized.logo = fallbackLogoByStoreId.get(String(restaurant._id)) || null;
        }
        const stats = statsMap.get(String(restaurant._id));
        if (stats) {
          serialized.ratingAverage = stats.ratingAverage;
          serialized.reviewCount = stats.reviewCount;
        } else {
          serialized.ratingAverage = 0;
          serialized.reviewCount = 0;
        }
        return serialized;
      }),
    });
  } catch (error) {
    console.error('Restaurant listing error:', error);
    return res.status(503).json({ success: false, message: 'Impossible de récupérer les boutiques.' });
  }
}

export async function updateStore(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const storeId = toObjectId(payload.storeId || payload.id);

  let store = storeId ? await Store.findById(storeId) : null;
  if (!store) {
    store = await Store.findOne({ ownerId: userId });
  }

  if (!store) {
    return res.status(404).json({ success: false, message: 'Boutique introuvable.' });
  }

  const role = req.session?.utilisateur?.role;
  const isOwner = String(store.ownerId) === String(userId);
  const isAdminUser = role === 'admin' || role === 'administrateur';
  if (!isOwner && !isAdminUser) {
    return res.status(403).json({ success: false, message: 'Accès refusé.' });
  }

  if (payload.name || payload.nom) store.nom = String(payload.name || payload.nom).trim();
  if (payload.address || payload.adresse) store.adresse = String(payload.address || payload.adresse).trim();
  if (payload.phone || payload.telephone) store.telephone = String(payload.phone || payload.telephone).trim();
  if (payload.logo != null) store.logo = String(payload.logo).trim() || null;
  if (payload.description != null) store.description = String(payload.description).trim();
  if (payload.category) store.category = String(payload.category).trim();
  if (payload.lat != null && payload.lat !== '') store.lat = Number(payload.lat);
  if (payload.lng != null && payload.lng !== '') store.lng = Number(payload.lng);
  if (payload.isOpen != null) {
    store.statut = String(payload.isOpen) === 'true' ? 'approuve' : 'en_attente';
  }

  if (store.lat == null || store.lng == null) {
    const coords = defaultStoreCoordinates(store.lat, store.lng);
    store.lat = coords.lat;
    store.lng = coords.lng;
  }

  await store.save();
  return res.json({ success: true, store: serializeStore(store) });
}
