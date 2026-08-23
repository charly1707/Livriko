import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { PaymentTransaction } from '../models/Payment.js';
import { currentUserId } from '../middleware/auth.js';
import { getPayload } from '../utils/http.js';
import { toObjectId } from '../utils/ids.js';
import { MtnMomoProvider } from '../services/mtnMomo.js';

function publicTransaction(transaction) {
  return {
    id: String(transaction._id || transaction.id || ''),
    provider: transaction.provider || null,
    providerTransactionId: transaction.providerTransactionId || transaction.provider_transaction_id || null,
    amount: Number(transaction.amount || 0),
    currency: transaction.currency || 'XOF',
    status: transaction.status || 'pending',
  };
}

function mtnConfig() {
  return {
    api_url: process.env.MTN_MOMO_API_URL || '',
    subscription_key: process.env.MTN_MOMO_SUBSCRIPTION_KEY || '',
    api_user: process.env.MTN_MOMO_API_USER || '',
    api_key: process.env.MTN_MOMO_API_KEY || '',
    target_environment: process.env.MTN_MOMO_TARGET_ENVIRONMENT || 'sandbox',
    callback_secret: process.env.MTN_MOMO_CALLBACK_SECRET || '',
  };
}

export async function createTransaction(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const orderId = toObjectId(payload.orderId);
  const phone = String(payload.phone || '').trim();
  let providerName = String(payload.provider || '').trim().toLowerCase();
  const idempotencyKey = String(payload.idempotencyKey || '').trim();

  if (!orderId || !phone || !idempotencyKey) {
    return res.status(400).json({ success: false, message: 'Commande, téléphone et clé d’idempotence requis.' });
  }

  const order = await Order.findById(orderId);
  if (!order || String(order.clientId) !== String(userId)) {
    return res.status(403).json({ success: false, message: 'Commande introuvable ou accès refusé.' });
  }

  if (order.paymentStatus === 'paid') {
    return res.status(409).json({ success: false, message: 'Cette commande est déjà payée.' });
  }

  try {
    providerName = providerName || String(process.env.PAYMENT_PROVIDER || 'mtn_momo').toLowerCase();
    if (providerName !== 'mtn_momo') {
      throw new Error('Aucun fournisseur Mobile Money officiellement configuré pour ce canal.');
    }

    const existing = await PaymentTransaction.findOne({ idempotencyKey });
    if (existing) {
      return res.json({ success: true, transaction: publicTransaction(existing) });
    }

    const reference = crypto.randomBytes(16).toString('hex');
    const provider = new MtnMomoProvider(mtnConfig());
    const result = await provider.requestPayment(reference, order.total, process.env.PAYMENT_CURRENCY || 'XOF', phone);

    const transaction = await PaymentTransaction.create({
      orderId,
      userId,
      provider: providerName,
      providerTransactionId: result.providerTransactionId,
      idempotencyKey,
      customerPhone: phone,
      amount: order.total,
      currency: process.env.PAYMENT_CURRENCY || 'XOF',
      status: result.status,
      providerPayload: result.raw,
    });

    return res.status(201).json({ success: true, transaction: publicTransaction(transaction) });
  } catch (error) {
    return res.status(503).json({ success: false, message: error.message });
  }
}

export async function paymentStatus(req, res) {
  const userId = currentUserId(req);
  const transactionId = toObjectId(req.query.transactionId);
  if (!transactionId) {
    return res.status(404).json({ success: false, message: 'Transaction introuvable.' });
  }
  const transaction = await PaymentTransaction.findOne({ _id: transactionId, userId });
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction introuvable.' });
  }
  return res.json({ success: true, transaction: publicTransaction(transaction) });
}
