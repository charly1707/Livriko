import { Conversation } from '../models/Conversation.js';
import { Order } from '../models/Order.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { currentUserId } from '../middleware/auth.js';
import { getPayload } from '../utils/http.js';
import { publicId, toObjectId } from '../utils/ids.js';
import { uploadImageBuffer } from '../services/cloudinaryUpload.js';

const ACTIVE_STATUSES = ['rider_assigned', 'picked_up', 'delivering'];

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

function serializeMessage(message, conversationId, sender, role) {
  return {
    id: publicId(message),
    conversation_id: String(conversationId),
    sender_id: String(message.senderId),
    message: message.message,
    message_type: message.messageType,
    is_read: message.isRead,
    created_at: message.createdAt,
    nom: sender?.nom || '',
    prenom: sender?.prenom || '',
    avatar: sender?.avatar || null,
    role: role || 'client',
  };
}

export async function getOrCreateConversation(req, res) {
  const payload = getPayload(req);
  const orderId = toObjectId(payload.order_id);
  if (!orderId) {
    return res.status(400).json({ error: 'Missing order_id' });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const participants = await orderParticipants(order);
  const userId = currentUserId(req);
  if (!participants.some((participant) => String(participant.userId) === String(userId))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  let conversation = await Conversation.findOne({ orderId });
  if (conversation) {
    if (!ACTIVE_STATUSES.includes(order.status)) {
      return res.status(403).json({ error: 'Chat unavailable for current order status' });
    }
    conversation.participants = participants;
    await conversation.save();
    return res.json({ id: publicId(conversation), order_id: String(orderId) });
  }

  if (!ACTIVE_STATUSES.includes(order.status)) {
    return res.status(403).json({ error: 'Chat unavailable for current order status' });
  }

  conversation = await Conversation.create({ orderId, participants, messages: [] });
  return res.json({ id: publicId(conversation), order_id: String(orderId) });
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
  const payload = getPayload(req);
  const convId = toObjectId(payload.conversation_id);
  const message = String(payload.message || '').trim();
  const type = payload.message_type || 'text';
  if (!convId || (type !== 'image' && message === '')) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const conversation = await Conversation.findById(convId).populate('orderId');
  if (!conversation || !isParticipant(conversation, currentUserId(req))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const orderStatus = conversation.orderId?.status;
  if (!ACTIVE_STATUSES.includes(orderStatus)) {
    return res.status(403).json({ error: 'Cannot send messages for inactive order' });
  }

  conversation.messages.push({
    senderId: currentUserId(req),
    message,
    messageType: type,
  });
  await conversation.save();
  const saved = conversation.messages[conversation.messages.length - 1];
  return res.json({
    id: publicId(saved),
    conversation_id: publicId(conversation),
    sender_id: String(currentUserId(req)),
    message,
    message_type: type,
    created_at: saved.createdAt,
  });
}

export async function getMessages(req, res) {
  const payload = getPayload(req);
  let convId = toObjectId(payload.conversation_id);
  const orderId = toObjectId(payload.order_id);

  if (orderId && !convId) {
    const conversation = await Conversation.findOne({ orderId });
    if (!conversation) {
      return res.json({ messages: [] });
    }
    convId = conversation._id;
  }

  if (!convId) {
    return res.json({ messages: [] });
  }

  const conversation = await Conversation.findById(convId).populate('orderId');
  if (!conversation || !isParticipant(conversation, currentUserId(req))) {
    return res.status(403).json({ messages: [] });
  }
  if (!ACTIVE_STATUSES.includes(conversation.orderId?.status)) {
    return res.status(403).json({ messages: [] });
  }

  const senderIds = [...new Set(conversation.messages.map((message) => String(message.senderId)))];
  const senders = await User.find({ _id: { $in: senderIds } });
  const senderMap = new Map(senders.map((sender) => [String(sender._id), sender]));
  const roleMap = new Map(conversation.participants.map((participant) => [String(participant.userId), participant.role]));

  return res.json({
    messages: conversation.messages.map((message) => serializeMessage(
      message,
      conversation._id,
      senderMap.get(String(message.senderId)),
      roleMap.get(String(message.senderId)),
    )),
  });
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
  if (!ACTIVE_STATUSES.includes(conversation.orderId?.status)) {
    return res.status(403).json({ error: 'Cannot mark messages for inactive order' });
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
  if (!ACTIVE_STATUSES.includes(conversation.orderId?.status)) {
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
