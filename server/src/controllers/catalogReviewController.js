import { CatalogReview } from '../models/CatalogReview.js';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { currentUserId } from '../middleware/auth.js';
import { getPayload } from '../utils/http.js';
import { publicId, toObjectId } from '../utils/ids.js';

function roundAverage(value) {
  return Math.round(value * 10) / 10;
}

export async function getReviewStatsMap(targetType, targetIds) {
  if (!targetIds.length) return new Map();

  const objectIds = targetIds
    .map((id) => toObjectId(id))
    .filter(Boolean);

  if (!objectIds.length) return new Map();

  const results = await CatalogReview.aggregate([
    { $match: { targetType, targetId: { $in: objectIds } } },
    {
      $group: {
        _id: '$targetId',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(results.map((row) => [String(row._id), {
    ratingAverage: roundAverage(row.average),
    reviewCount: row.count,
  }]));
}

async function getStats(targetType, targetId) {
  const reviews = await CatalogReview.find({ targetType, targetId });
  const total = reviews.length;
  const average = total
    ? roundAverage(reviews.reduce((sum, review) => sum + review.rating, 0) / total)
    : 0;
  return { average, count: total };
}

async function canReviewStore(clientId, storeId) {
  return Order.exists({
    clientId,
    storeId,
    status: 'delivered',
  });
}

async function canReviewProduct(clientId, productId) {
  return Order.exists({
    clientId,
    status: 'delivered',
    'items.productId': productId,
  });
}

function serializeReview(review, currentId) {
  const client = review.clientId;
  const clientName = client
    ? [client.prenom, client.nom].filter(Boolean).join(' ').trim() || client.nom_utilisateur || 'Client'
    : 'Client';

  return {
    id: publicId(review),
    rating: review.rating,
    comment: review.comment,
    clientName,
    createdAt: review.createdAt,
    isOwn: currentId ? String(review.clientId?._id || review.clientId) === String(currentId) : false,
  };
}

export async function listCatalogReviews(req, res) {
  const storeId = toObjectId(req.query.store_id);
  const productId = toObjectId(req.query.product_id);
  const userId = currentUserId(req);

  if (!storeId && !productId) {
    return res.status(400).json({ error: 'store_id ou product_id requis' });
  }
  if (storeId && productId) {
    return res.status(400).json({ error: 'Indiquez store_id ou product_id, pas les deux' });
  }

  const targetType = storeId ? 'store' : 'product';
  const targetId = storeId || productId;

  if (targetType === 'store') {
    const store = await Store.findById(targetId);
    if (!store) return res.status(404).json({ error: 'Boutique introuvable' });
  } else {
    const product = await Product.findById(targetId);
    if (!product) return res.status(404).json({ error: 'Article introuvable' });
  }

  const reviews = await CatalogReview.find({ targetType, targetId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('clientId', 'prenom nom nom_utilisateur');

  const stats = await getStats(targetType, targetId);

  let userReview = null;
  let canReview = false;

  if (userId) {
    const existing = await CatalogReview.findOne({ targetType, targetId, clientId: userId })
      .populate('clientId', 'prenom nom nom_utilisateur');
    if (existing) {
      userReview = serializeReview(existing, userId);
    } else if (targetType === 'store') {
      canReview = Boolean(await canReviewStore(userId, targetId));
    } else {
      canReview = Boolean(await canReviewProduct(userId, targetId));
    }
  }

  return res.json({
    success: true,
    reviews: reviews.map((review) => serializeReview(review, userId)),
    stats,
    userReview,
    canReview,
  });
}

export async function createCatalogReview(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const targetType = String(payload.target_type || '').trim();
  const targetId = toObjectId(payload.target_id);
  const rating = Number(payload.rating || 0);
  const comment = String(payload.comment || '').trim();

  if (!['store', 'product'].includes(targetType)) {
    return res.status(400).json({ error: 'target_type invalide (store ou product)' });
  }
  if (!targetId) {
    return res.status(400).json({ error: 'target_id invalide' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
  }

  if (targetType === 'store') {
    const store = await Store.findById(targetId);
    if (!store) return res.status(404).json({ error: 'Boutique introuvable' });
    if (!await canReviewStore(userId, targetId)) {
      return res.status(403).json({ error: 'Vous devez avoir reçu une commande de cette boutique pour la noter' });
    }
  } else {
    const product = await Product.findById(targetId);
    if (!product) return res.status(404).json({ error: 'Article introuvable' });
    if (!await canReviewProduct(userId, targetId)) {
      return res.status(403).json({ error: 'Vous devez avoir reçu cet article pour le noter' });
    }
  }

  if (await CatalogReview.exists({ targetType, targetId, clientId: userId })) {
    return res.status(409).json({ error: 'Vous avez déjà laissé un avis' });
  }

  try {
    const created = await CatalogReview.create({
      targetType,
      targetId,
      clientId: userId,
      rating,
      comment: comment || null,
    });

    const stats = await getStats(targetType, targetId);

    return res.json({
      success: true,
      review: {
        id: publicId(created),
        rating: created.rating,
        comment: created.comment,
        createdAt: created.createdAt,
      },
      stats,
    });
  } catch (error) {
    console.error('Catalog review create error:', error);
    return res.status(500).json({ error: 'Impossible d\'enregistrer l\'avis' });
  }
}
