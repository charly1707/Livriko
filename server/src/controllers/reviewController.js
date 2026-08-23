import { Review, DeliveryReport } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { currentUser, currentUserId } from '../middleware/auth.js';
import { getPayload, isAdmin, parseJsonField } from '../utils/http.js';
import { publicId, toObjectId } from '../utils/ids.js';

async function notifyAdmins(titre, message) {
  const admins = await User.find({ role: { $in: ['admin', 'administrateur'] } });
  if (admins.length === 0) return;
  await Notification.insertMany(admins.map((admin) => ({
    userId: admin._id,
    titre,
    message,
  })));
}

async function driverStats(deliveryPersonId) {
  const reviews = await Review.find({ deliveryPersonId });
  const total = reviews.length;
  const average = total ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / total) * 100) / 100 : 0;
  const negative_count = reviews.filter((review) => review.rating <= 2).length;
  return { total, average, negative_count };
}

export async function createReview(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const orderId = toObjectId(payload.order_id);
  const rating = Number(payload.rating || 0);
  const comment = String(payload.comment || '').trim();
  const reasons = parseJsonField(payload.reasons, []);

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }
  if (String(order.clientId) !== String(userId)) {
    return res.status(403).json({ error: 'Vous ne pouvez évaluer que vos propres commandes' });
  }
  if (order.status !== 'delivered') {
    return res.status(400).json({ error: 'La commande n\'est pas marquée comme livrée' });
  }
  if (await Review.exists({ orderId })) {
    return res.status(409).json({ error: 'Cette commande a déjà été évaluée' });
  }
  if (!order.delivery?.riderId) {
    return res.status(400).json({ error: 'Aucun livreur associé à cette commande' });
  }

  try {
    const created = await Review.create({
      orderId,
      clientId: userId,
      deliveryPersonId: order.delivery.riderId,
      rating,
      comment: comment || null,
      reasons,
    });

    const stats = await driverStats(order.delivery.riderId);
    if ((stats.average || 0) < 3 && stats.total > 0) {
      await notifyAdmins(
        'Attention : livreur mal noté',
        `Le livreur ID ${order.delivery.riderId} a une note moyenne de ${stats.average} (<3). Veuillez examiner les évaluations.`,
      );
    }

    const reportCount = await DeliveryReport.countDocuments({ deliveryPersonId: order.delivery.riderId });
    if (reportCount >= 3) {
      await notifyAdmins(
        'Alerte : plusieurs signalements',
        `Plusieurs signalements (${reportCount}) ont été enregistrés pour le livreur ID ${order.delivery.riderId}.`,
      );
    }

    return res.json({ success: true, review: { ...created.toObject(), id: publicId(created) } });
  } catch (error) {
    console.error('Review create error:', error);
    return res.status(500).json({ error: 'Impossible de créer l\'évaluation' });
  }
}

export async function listForDriver(req, res) {
  const driverId = toObjectId(req.query.driver_id);
  if (!driverId) {
    return res.status(400).json({ error: 'driver_id requis' });
  }
  const results = await Review.find({ deliveryPersonId: driverId }).sort({ createdAt: -1 }).populate('clientId');
  const stats = await driverStats(driverId);
  return res.json({
    success: true,
    reviews: results.map((review) => ({
      ...review.toObject(),
      id: publicId(review),
      client_nom: review.clientId?.nom,
      client_prenom: review.clientId?.prenom,
    })),
    stats,
  });
}

export async function adminList(req, res) {
  if (!isAdmin(currentUser(req)?.role)) {
    return res.status(403).json({ error: 'Accès admin requis' });
  }
  const filters = {};
  if (req.query.driver_id) filters.deliveryPersonId = toObjectId(req.query.driver_id);
  if (req.query.rating) filters.rating = Number(req.query.rating);
  if (req.query.order_id) filters.orderId = toObjectId(req.query.order_id);

  let query = Review.find(filters).sort({ createdAt: -1 })
    .populate('orderId')
    .populate('clientId')
    .populate('deliveryPersonId');

  const list = await query;
  let reviews = list.map((review) => ({
    ...review.toObject(),
    id: publicId(review),
    code_commande: review.orderId?.code,
    client_nom: review.clientId?.nom,
    client_prenom: review.clientId?.prenom,
    driver_nom: review.deliveryPersonId?.nom,
    driver_prenom: review.deliveryPersonId?.prenom,
  }));

  if (req.query.reported) {
    const reportedOrderIds = await DeliveryReport.distinct('orderId');
    const reported = new Set(reportedOrderIds.map(String));
    reviews = reviews.filter((review) => reported.has(String(review.orderId?._id || review.orderId)));
  }

  return res.json({ success: true, reviews });
}

export async function createReport(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const orderId = toObjectId(payload.order_id);
  const reason = String(payload.reason || '').trim();
  const description = String(payload.description || '').trim();

  if (!orderId || !reason) {
    return res.status(400).json({ error: 'order_id et reason requis' });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }
  if (String(order.clientId) !== String(userId)) {
    return res.status(403).json({ error: 'Vous ne pouvez signaler que vos propres commandes' });
  }
  if (!order.delivery?.riderId) {
    return res.status(400).json({ error: 'Aucun livreur associé à cette commande' });
  }

  const report = await DeliveryReport.create({
    orderId,
    clientId: userId,
    deliveryPersonId: order.delivery.riderId,
    reason,
    description: description || null,
  });

  return res.json({ success: true, report_id: publicId(report) });
}
