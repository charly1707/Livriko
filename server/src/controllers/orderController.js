import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { currentUser, currentUserId } from '../middleware/auth.js';
import { getPayload, isAdmin, isSeller, parseJsonField } from '../utils/http.js';
import { orderPublicId, publicId, storePublicId, toObjectId } from '../utils/ids.js';

function serializeOrder(order, extras = {}) {
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
    createdAt: order.createdAt,
    deliveryStatus: order.delivery?.status || null,
    riderId: order.delivery?.riderId ? String(order.delivery.riderId) : null,
    notes: order.notes || '',
    distanceKm: order.delivery?.distanceKm ?? null,
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

    const deliveryFee = Math.max(0, Number(payload.deliveryFee || 0));
    const total = subtotal + deliveryFee;
    const allowedPayments = ['cash', 'momo_mtn', 'momo_moov', 'orange_money', 'celtis_cash'];
    const paymentMethod = allowedPayments.includes(payload.paymentMethod) ? payload.paymentMethod : 'cash';
    const address = String(payload.clientAddress || '').trim();
    if (!address) {
      return res.status(400).json({ success: false, message: 'Adresse de livraison requise.' });
    }

    const store = await Store.findById(storeId);
    const user = await User.findById(userId);
    const code = `#LVK-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`;

    const order = await Order.create({
      code,
      clientId: userId,
      storeId,
      clientName: payload.clientName || (user ? `${user.prenom} ${user.nom}`.trim() : 'Client'),
      clientPhone: payload.clientPhone || user?.telephone || '',
      clientAddress: address,
      clientLat: payload.clientLat ? Number(payload.clientLat) : null,
      clientLng: payload.clientLng ? Number(payload.clientLng) : null,
      storeName: store?.nom || 'Boutique',
      storeAddress: store?.adresse || '',
      storeLat: store?.lat ?? null,
      storeLng: store?.lng ?? null,
      items: normalizedItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      paymentSource: paymentMethod === 'cash' ? 'cash' : 'direct_momo',
      paymentStatus: 'pending',
      notes: payload.notes || '',
      delivery: {
        distanceKm: payload.distanceKm ? Number(payload.distanceKm) : null,
        status: null,
      },
      history: [{ status: 'pending', at: new Date() }],
    });

    return res.status(201).json({ success: true, order: serializeOrder(order, { store }) });
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ success: false, message: 'Impossible d’enregistrer la commande.' });
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
    return res.status(403).json({ success: false, message: 'Accès refusé.' });
  }

  const role = currentUser(req)?.role || 'client';
  if (role === 'client' && String(order.clientId) !== String(userId)) {
    return res.status(403).json({ success: false, message: 'Accès refusé.' });
  }

  const sellerStatuses = ['confirmed', 'rider_requested', 'cancelled'];
  const riderStatuses = ['rider_assigned', 'picked_up', 'delivering', 'delivered'];
  const clientStatuses = ['cancelled'];
  const allowedForRole = isSeller(role)
    ? sellerStatuses
    : role === 'livreur'
      ? riderStatuses
      : role === 'client'
        ? clientStatuses
        : [...sellerStatuses, ...riderStatuses, ...clientStatuses];

  if (!allowedForRole.includes(status)) {
    return res.status(403).json({ success: false, message: 'Ce rôle ne peut pas appliquer ce statut.' });
  }

  if (role === 'livreur' && status === 'rider_assigned') {
    const rider = await User.findById(userId);
    if (!rider || rider.role !== 'livreur' || rider.statut !== 'actif') {
      return res.status(403).json({ success: false, message: 'Votre profil livreur doit être actif et validé.' });
    }
    if (!order.delivery) order.delivery = {};
    if (!order.delivery.riderId) {
      order.delivery.riderId = rider._id;
      order.delivery.status = 'accepte';
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
