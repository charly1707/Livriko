import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { currentUser, currentUserId } from '../middleware/auth.js';
import { getPayload, isAdmin, isSeller, parseJsonField } from '../utils/http.js';
import { orderPublicId, publicId, storePublicId, toObjectId } from '../utils/ids.js';
import { defaultStoreCoordinates } from '../utils/geo.js';
import { calculateDeliveryFee, haversineKm, isValidLatLng } from '../utils/deliveryPricing.js';
import { getRoute } from '../services/maps.js';

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['rider_requested', 'cancelled'],
  rider_requested: ['rider_assigned', 'cancelled'],
  rider_assigned: ['picked_up', 'cancelled'],
  picked_up: ['delivering'],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
};

async function serializeOrder(order, extras = {}) {
  let riderName = extras.riderName || null;
  let riderPhone = extras.riderPhone || null;
  if (order.delivery?.riderId && !riderName) {
    const rider = await User.findById(order.delivery.riderId);
    if (rider) {
      riderName = `${rider.prenom} ${rider.nom}`.trim();
      riderPhone = rider.telephone;
    }
  }

  return {
    id: orderPublicId(order),
    databaseId: publicId(order),
    code: order.code,
    clientId: String(order.clientId),
    clientName: order.clientName || extras.clientName || 'Client',
    clientPhone: order.clientPhone || extras.clientPhone || '',
    clientAddress: order.clientAddress,
    clientLat: order.clientLat,
    clientLng: order.clientLng,
    storeId: extras.store ? storePublicId(extras.store) : `store-${String(order.storeId)}`,
    storeName: order.storeName || extras.store?.nom || 'Boutique',
    storeAddress: order.storeAddress || extras.store?.adresse || '',
    storeLat: order.storeLat,
    storeLng: order.storeLng,
    items: (order.items || []).map((item) => ({
      productId: String(item.productId || ''),
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    totalAmount: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentSource: order.paymentSource,
    createdAt: order.createdAt,
    deliveryStatus: order.delivery?.status || null,
    riderId: order.delivery?.riderId ? String(order.delivery.riderId) : null,
    riderName,
    riderPhone,
    notes: order.notes || '',
    distanceKm: order.delivery?.distanceKm ?? null,
    cancellationReason: order.cancellationReason || null,
  };
}

async function findOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) return null;
  const [store, client] = await Promise.all([
    Store.findById(order.storeId),
    User.findById(order.clientId),
  ]);
  return serializeOrder(order, {
    store,
    clientName: client ? `${client.prenom} ${client.nom}`.trim() : order.clientName,
    clientPhone: client?.telephone || order.clientPhone,
  });
}

function canTransition(from, to) {
  return (STATUS_TRANSITIONS[from] || []).includes(to);
}

export async function createOrder(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const items = parseJsonField(payload.items, []);
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'La commande ne contient aucun produit.' });
  }

  const productIds = items.map((item) => toObjectId(item.productId)).filter(Boolean);
  if (productIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Produits invalides.' });
  }

  try {
    const products = await Product.find({ _id: { $in: productIds }, enStock: true });
    const byId = new Map(products.map((product) => [String(product._id), product]));
    const uniqueIds = [...new Set(productIds.map(String))];
    if (byId.size !== uniqueIds.length) {
      return res.status(409).json({ success: false, message: 'Un produit est indisponible.' });
    }

    const first = products[0];
    const storeId = String(first.storeId);
    let subtotal = 0;
    const normalizedItems = [];
    for (const item of items) {
      const product = byId.get(String(toObjectId(item.productId)));
      const quantity = Math.max(1, Number(item.quantity || 1));
      if (!product || String(product.storeId) !== storeId) {
        return res.status(409).json({ success: false, message: 'Tous les produits doivent provenir de la même entreprise.' });
      }
      const lineTotal = product.prix * quantity;
      subtotal += lineTotal;
      normalizedItems.push({
        productId: product._id,
        productName: product.nom,
        unitPrice: product.prix,
        quantity,
        subtotal: lineTotal,
      });
    }

    const paymentMethod = 'cash';
    const address = String(payload.clientAddress || '').trim();
    if (!address) {
      return res.status(400).json({ success: false, message: 'Adresse de livraison requise.' });
    }

    const store = await Store.findById(storeId);
    const user = await User.findById(userId);
    const storeCoords = defaultStoreCoordinates(store?.lat, store?.lng);
    const clientLat = payload.clientLat != null ? Number(payload.clientLat) : null;
    const clientLng = payload.clientLng != null ? Number(payload.clientLng) : null;
    if (!isValidLatLng(clientLat, clientLng)) {
      return res.status(400).json({ success: false, message: 'Position GPS de livraison invalide.' });
    }

    // Recalcul serveur : distance (OSRM si possible, sinon Haversine) + barème officiel.
    let distanceKm = haversineKm(storeCoords.lat, storeCoords.lng, clientLat, clientLng);
    try {
      const routeBody = await getRoute(storeCoords.lat, storeCoords.lng, clientLat, clientLng);
      const meters = routeBody?.routes?.[0]?.distance;
      if (Number.isFinite(meters) && meters > 0) {
        distanceKm = Math.max(0.1, Math.round((meters / 1000) * 10) / 10);
      }
    } catch {
      // fallback Haversine déjà calculé
    }
    const feeBreakdown = calculateDeliveryFee(distanceKm);
    const deliveryFee = feeBreakdown.deliveryFee;
    const total = subtotal + deliveryFee;
    const code = `#LVK-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`;

    let paymentStatus = 'pending';
    let paymentSource = 'cash';

    const order = await Order.create({
      code,
      clientId: userId,
      storeId,
      clientName: payload.clientName || (user ? `${user.prenom} ${user.nom}`.trim() : 'Client'),
      clientPhone: payload.clientPhone || user?.telephone || '',
      clientAddress: address,
      clientLat,
      clientLng,
      storeName: store?.nom || 'Boutique',
      storeAddress: store?.adresse || '',
      storeLat: storeCoords.lat,
      storeLng: storeCoords.lng,
      items: normalizedItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      paymentSource,
      paymentStatus,
      momoTransactionRef: null,
      notes: payload.notes || '',
      delivery: {
        distanceKm: feeBreakdown.distanceKm,
        status: null,
      },
      history: [{ status: 'pending', at: new Date() }],
    });

    return res.status(201).json({ success: true, order: await serializeOrder(order, { store }) });
  } catch (error) {
    console.error('Order creation error:', error);
    const message = error.message?.includes('portefeuille')
      ? error.message
      : 'Impossible d’enregistrer la commande.';
    return res.status(error.message?.includes('portefeuille') ? 402 : 500).json({ success: false, message });
  }
}

export async function listOrders(req, res) {
  const userId = currentUserId(req);
  const role = currentUser(req)?.role || 'client';
  let filter = { clientId: userId };

  if (isSeller(role)) {
    const store = await Store.findOne({ ownerId: userId });
    filter = store ? { storeId: store._id } : { _id: null };
  } else if (role === 'livreur') {
    filter = {
      $or: [
        { status: { $in: ['rider_requested', 'rider_assigned', 'picked_up', 'delivering'] } },
        { 'delivery.riderId': userId },
      ],
    };
  } else if (isAdmin(role)) {
    filter = {};
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  const serialized = [];
  for (const order of orders) {
    serialized.push(await findOrder(order._id));
  }
  return res.json({ success: true, orders: serialized });
}

export async function updateOrderStatus(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const orderId = toObjectId(payload.orderId);
  const status = String(payload.status || '');
  const allowed = ['confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering', 'delivered', 'cancelled'];
  if (!orderId || !allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Commande ou statut invalide.' });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Commande introuvable.' });
  }

  const role = currentUser(req)?.role || 'client';

  if (!isAdmin(role) && !canTransition(order.status, status)) {
    return res.status(409).json({
      success: false,
      message: `Transition impossible : ${order.status} → ${status}.`,
    });
  }

  if (role === 'client' && String(order.clientId) !== String(userId)) {
    return res.status(403).json({ success: false, message: 'Accès refusé.' });
  }

  if (isSeller(role)) {
    const store = await Store.findOne({ ownerId: userId });
    if (!store || String(store._id) !== String(order.storeId)) {
      return res.status(403).json({ success: false, message: 'Cette commande n’appartient pas à votre boutique.' });
    }
  }

  const sellerStatuses = ['confirmed', 'rider_requested', 'cancelled'];
  const riderStatuses = ['rider_assigned', 'picked_up', 'delivering', 'delivered'];
  const clientStatuses = ['cancelled'];
  const allowedForRole = isAdmin(role)
    ? allowed
    : isSeller(role)
      ? sellerStatuses
      : role === 'livreur'
        ? riderStatuses
        : role === 'client'
          ? clientStatuses
          : [];

  if (!allowedForRole.includes(status)) {
    return res.status(403).json({ success: false, message: 'Ce rôle ne peut pas appliquer ce statut.' });
  }

  if (role === 'livreur') {
    const rider = await User.findById(userId);
    if (!rider || rider.role !== 'livreur' || rider.statut !== 'actif') {
      return res.status(403).json({ success: false, message: 'Votre profil livreur doit être actif.' });
    }
    if (!rider.documentsValide || rider.verificationStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'Votre dossier livreur doit être approuvé par l’administration.' });
    }

    if (status === 'rider_assigned') {
      if (!order.delivery) order.delivery = {};
      if (order.delivery.riderId && String(order.delivery.riderId) !== String(userId)) {
        return res.status(409).json({ success: false, message: 'Un autre livreur est déjà assigné.' });
      }
      order.delivery.riderId = rider._id;
      order.delivery.status = 'accepte';
    } else if (order.delivery?.riderId && String(order.delivery.riderId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Cette course est assignée à un autre livreur.' });
    }
  }

  const deliveryStatus = {
    rider_requested: 'recherche',
    rider_assigned: 'accepte',
    picked_up: 'recupere',
    delivering: 'en_route',
    delivered: 'livre',
  }[status];

  if (deliveryStatus) {
    if (!order.delivery) order.delivery = {};
    order.delivery.status = deliveryStatus;
    if (deliveryStatus === 'livre') order.delivery.arrivedAt = new Date();
    if (['en_route', 'recupere'].includes(deliveryStatus) && !order.delivery.startedAt) {
      order.delivery.startedAt = new Date();
    }
  }

  order.status = status;
  if (payload.reason) order.cancellationReason = String(payload.reason);
  order.history.push({ status, at: new Date() });
  await order.save();

  return res.json({ success: true, order: await findOrder(order._id) });
}
