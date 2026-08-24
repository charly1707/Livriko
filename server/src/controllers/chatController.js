import { Conversation } from '../models/Conversation.js';
import { Order } from '../models/Order.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { currentUser, currentUserId } from '../middleware/auth.js';
import { getPayload, isAdmin } from '../utils/http.js';
import { publicId, toObjectId } from '../utils/ids.js';
import { uploadImageBuffer } from '../services/cloudinaryUpload.js';

const CHAT_OPEN_STATUSES = ['pending', 'confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering'];
const CHAT_READ_STATUSES = [...CHAT_OPEN_STATUSES, 'delivered'];

function isParticipant(conversation, userId) {
  return (conversation.participants || []).some((participant) => String(participant.userId) === String(userId));
}

async function orderParticipants(order) {
  const store = await Store.findById(order.storeId);
  const participants = [
    { userId: order.clientId, role: 'client' },
  ];
  if (store?.ownerId) {
    participants.push({ userId: store.ownerId, role: 'restaurant' });
  }
  if (order.delivery?.riderId) {
    participants.push({ userId: order.delivery.riderId, role: 'livreur' });
  }
  return participants;
}

function canAccessOrder(order, store, userId, role) {
  if (isAdmin(role)) return true;
  if (String(order.clientId) === String(userId)) return true;
  if (store?.ownerId && String(store.ownerId) === String(userId)) return true;
  if (order.delivery?.riderId && String(order.delivery.riderId) === String(userId)) return true;
  return false;
}

function participantRoleForUser(order, store, userId, role) {
  if (String(order.clientId) === String(userId)) return 'client';
  if (store?.ownerId && String(store.ownerId) === String(userId)) return 'restaurant';
  if (order.delivery?.riderId && String(order.delivery.riderId) === String(userId)) return 'livreur';
  if (role === 'vendeur' || role === 'restaurant') return 'restaurant';
  if (role === 'livreur') return 'livreur';
  return 'client';
}

async function syncParticipants(conversation, order) {
  const next = await orderParticipants(order);
  const byUser = new Map((conversation.participants || []).map((p) => [String(p.userId), p]));
  for (const participant of next) {
    byUser.set(String(participant.userId), participant);
  }
  conversation.participants = [...byUser.values()];
  return conversation;
}

function serializeMessage(message, conversationId, sender, role) {
  const senderRole = role || 'client';
  return {
    id: publicId(message),
    conversation_id: String(conversationId),
    sender_id: String(message.senderId),
    senderId: String(message.senderId),
    message: message.message,
    content: message.message,
    message_type: message.messageType,
    is_read: message.isRead,
    created_at: message.createdAt,
    nom: sender?.nom || '',
    prenom: sender?.prenom || '',
    avatar: sender?.avatar || null,
    role: senderRole,
    sender_role: senderRole,
    senderRole: senderRole,
  };
}

async function loadConversationContext(req, orderIdValue, convIdValue) {
  const userId = currentUserId(req);
  const role = currentUser(req)?.role;
  const orderId = toObjectId(orderIdValue);
  let convId = toObjectId(convIdValue);
  let conversation = convId ? await Conversation.findById(convId) : null;

  if (!conversation && orderId) {
    conversation = await Conversation.findOne({ orderId });
  }

  const resolvedOrderId = conversation?.orderId || orderId;
  if (!resolvedOrderId) return { error: { status: 400, body: { error: 'Missing order_id' } } };

  const order = await Order.findById(resolvedOrderId);
  if (!order) return { error: { status: 404, body: { error: 'Commande introuvable' } } };

  const store = await Store.findById(order.storeId);
  if (!canAccessOrder(order, store, userId, role)) {
    return { error: { status: 403, body: { error: 'Accès refusé à cette conversation' } } };
  }

  if (!conversation) {
    try {
      conversation = await Conversation.create({
        orderId: order._id,
        participants: await orderParticipants(order),
        messages: [],
      });
    } catch {
      conversation = await Conversation.findOne({ orderId: order._id });
      if (!conversation) {
        return { error: { status: 500, body: { error: 'Impossible d’ouvrir la conversation.' } } };
      }
    }
  } else {
    await syncParticipants(conversation, order);
    if (!isParticipant(conversation, userId) && !isAdmin(role)) {
      conversation.participants.push({
        userId,
        role: participantRoleForUser(order, store, userId, role),
      });
    }
    await conversation.save();
  }

  return { conversation, order, store, userId, role };
}

export async function getOrCreateConversation(req, res) {
  try {
    const payload = getPayload(req);
    const loaded = await loadConversationContext(req, payload.order_id, payload.conversation_id);
    if (loaded.error) {
      return res.status(loaded.error.status).json(loaded.error.body);
    }

    const { conversation, order } = loaded;
    if (!CHAT_READ_STATUSES.includes(order.status)) {
      return res.status(403).json({ error: 'Le chat n’est plus disponible pour cette commande.' });
    }

    return res.json({
      id: publicId(conversation),
      order_id: String(order._id),
      order_code: order.code,
      order_status: order.status,
      can_send: CHAT_OPEN_STATUSES.includes(order.status),
    });
  } catch (error) {
    console.error('Chat create error:', error);
    return res.status(500).json({ error: 'Impossible d’ouvrir la conversation.' });
  }
}

export async function addParticipant(req, res) {
  const payload = getPayload(req);
  const convId = toObjectId(payload.conversation_id);
  const userId = toObjectId(payload.user_id);
  const role = payload.role || 'livreur';
  const allowedRoles = ['client', 'restaurant', 'vendeur', 'livreur'];
  if (!convId || !userId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Role invalide' });
  }

  const conversation = await Conversation.findById(convId);
  if (!conversation || !isParticipant(conversation, currentUserId(req))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.role !== role && !(role === 'restaurant' && user.role === 'vendeur')) {
    return res.status(400).json({ error: 'Le rôle de l’utilisateur ne correspond pas' });
  }

  if (!isParticipant(conversation, userId)) {
    conversation.participants.push({ userId, role });
    await conversation.save();
  }
  return res.json({ ok: true });
}

export async function sendMessage(req, res) {
  try {
    const payload = getPayload(req);
    const message = String(payload.message || '').trim();
    const type = payload.message_type || 'text';
    if (type !== 'image' && message === '') {
      return res.status(400).json({ error: 'Écrivez un message.' });
    }

    const loaded = await loadConversationContext(req, payload.order_id, payload.conversation_id);
    if (loaded.error) {
      return res.status(loaded.error.status).json(loaded.error.body);
    }

    const { conversation, order, userId } = loaded;
    if (!CHAT_OPEN_STATUSES.includes(order.status)) {
      return res.status(403).json({ error: 'Cette commande est terminée : envoi désactivé.' });
    }

    conversation.messages.push({
      senderId: userId,
      message,
      messageType: type,
    });
    await conversation.save();
    const saved = conversation.messages[conversation.messages.length - 1];
    return res.json({
      id: publicId(saved),
      conversation_id: publicId(conversation),
      sender_id: String(userId),
      senderId: String(userId),
      message,
      content: message,
      message_type: type,
      created_at: saved.createdAt,
      sender_role: currentUser(req)?.role || 'client',
    });
  } catch (error) {
    console.error('Chat send error:', error);
    return res.status(500).json({ error: 'Envoi du message impossible.' });
  }
}

export async function getMessages(req, res) {
  try {
    const payload = getPayload(req);
    const loaded = await loadConversationContext(req, payload.order_id, payload.conversation_id);
    if (loaded.error) {
      if (loaded.error.status === 400) {
        return res.json({ messages: [] });
      }
      return res.status(loaded.error.status).json({ messages: [], error: loaded.error.body.error });
    }

    const { conversation, order } = loaded;
    if (!CHAT_READ_STATUSES.includes(order.status)) {
      return res.json({ messages: [], conversation_id: publicId(conversation), can_send: false });
    }

    const senderIds = [...new Set(conversation.messages.map((message) => String(message.senderId)))];
    const senders = senderIds.length ? await User.find({ _id: { $in: senderIds } }) : [];
    const senderMap = new Map(senders.map((sender) => [String(sender._id), sender]));
    const roleMap = new Map(conversation.participants.map((participant) => [String(participant.userId), participant.role]));

    return res.json({
      conversation_id: publicId(conversation),
      can_send: CHAT_OPEN_STATUSES.includes(order.status),
      messages: conversation.messages.map((message) => serializeMessage(
        message,
        conversation._id,
        senderMap.get(String(message.senderId)),
        roleMap.get(String(message.senderId)),
      )),
    });
  } catch (error) {
    console.error('Chat messages error:', error);
    return res.status(500).json({ messages: [], error: 'Impossible de charger les messages.' });
  }
}

export async function markRead(req, res) {
  const convId = toObjectId(getPayload(req).conversation_id);
  if (!convId) {
    return res.status(400).json({ error: 'Missing' });
  }
  const conversation = await Conversation.findById(convId).populate('orderId');
  if (!conversation || !isParticipant(conversation, currentUserId(req))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  conversation.messages.forEach((message) => {
    message.isRead = true;
  });
  await conversation.save();
  return res.json({ ok: true });
}

export async function uploadChatImage(req, res) {
  const convId = toObjectId(getPayload(req).conversation_id);
  if (!convId) {
    return res.status(400).json({ error: 'Missing conversation_id' });
  }
  const conversation = await Conversation.findById(convId).populate('orderId');
  if (!conversation || !isParticipant(conversation, currentUserId(req))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (!CHAT_OPEN_STATUSES.includes(conversation.orderId?.status)) {
    return res.status(403).json({ error: 'Cannot upload image for inactive order' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file' });
  }

  try {
    const uploaded = await uploadImageBuffer(req.file.buffer, {
      folder: 'chat',
      filename: req.file.originalname || 'chat',
    });
    return res.json({ url: uploaded.url, success: true });
  } catch (error) {
    console.error('Chat image upload error:', error);
    return res.status(503).json({ error: error.message || 'Impossible d’envoyer l’image.' });
  }
}
