import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { WebhookEvent, PaymentTransaction } from '../models/Payment.js';

function mapStatus(providerStatus) {
  const status = String(providerStatus || 'pending').toLowerCase();
  if (status === 'successful') return 'successful';
  if (status === 'failed') return 'failed';
  if (status === 'rejected' || status === 'cancelled') return 'cancelled';
  return 'pending';
}

export async function mtnWebhook(req, res) {
  const raw = req.rawBody || (Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {}));
  let payload = req.body;
  if (Buffer.isBuffer(payload) || typeof payload === 'string') {
    try {
      payload = JSON.parse(raw);
    } catch {
      return res.status(400).json({ success: false, message: 'Payload invalide.' });
    }
  }
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ success: false, message: 'Payload invalide.' });
  }

  const eventId = String(req.get('x-event-id') || payload.eventId || payload.referenceId || '').trim();
  const signature = String(req.get('x-webhook-signature') || '');
  const secret = String(process.env.MTN_MOMO_CALLBACK_SECRET || '');

  if (!eventId) {
    return res.status(400).json({ success: false, message: 'Identifiant événement requis.' });
  }

  if (secret && (signature === '' || crypto.createHmac('sha256', secret).update(raw).digest('hex') !== signature)) {
    return res.status(401).json({ success: false, message: 'Webhook invalide.' });
  }

  try {
    try {
      await WebhookEvent.create({
        provider: 'mtn_momo',
        eventId,
        signatureValid: true,
        payload,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.json({ success: true, duplicate: true });
      }
      throw error;
    }

    const providerTransactionId = String(payload.referenceId || payload.financialTransactionId || eventId);
    const status = mapStatus(payload.status);
    const payment = await PaymentTransaction.findOne({
      provider: 'mtn_momo',
      providerTransactionId,
    });

    if (payment) {
      payment.status = status;
      payment.providerPayload = payload;
      if (status === 'failed' || status === 'cancelled') {
        payment.failureReason = payload.reason || payment.failureReason;
      }
      await payment.save();
      if (status === 'successful') {
        await Order.updateOne(
          { _id: payment.orderId, paymentStatus: { $ne: 'paid' } },
          { $set: { paymentStatus: 'paid' } },
        );
      }
    }

    await WebhookEvent.updateOne({ provider: 'mtn_momo', eventId }, { $set: { processedAt: new Date() } });
    return res.json({ success: true });
  } catch (error) {
    console.error('MTN webhook error:', error);
    return res.status(500).json({ success: false, message: 'Webhook non traité.' });
  }
}
