import { User } from '../models/User.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { currentUserId } from '../middleware/auth.js';
import { getPayload } from '../utils/http.js';
import { toObjectId } from '../utils/ids.js';

export async function getWallet(req, res) {
  const userId = currentUserId(req);
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }

  const transactions = await WalletTransaction.find({ userId }).sort({ createdAt: -1 }).limit(50);
  return res.json({
    success: true,
    balance: user.walletBalance ?? 0,
    transactions: transactions.map((tx) => ({
      id: String(tx._id),
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      status: tx.status,
      reference: tx.reference,
      description: tx.description,
      createdAt: tx.createdAt,
    })),
  });
}

export async function creditWallet(req, res) {
  const payload = getPayload(req);
  const userId = toObjectId(payload.userId);
  const amount = Number(payload.amount || 0);
  if (!userId || !(amount > 0)) {
    return res.status(400).json({ success: false, message: 'Montant ou utilisateur invalide.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }

  user.walletBalance = (user.walletBalance ?? 0) + amount;
  await user.save();

  await WalletTransaction.create({
    userId: user._id,
    type: 'credit',
    amount,
    balanceAfter: user.walletBalance,
    status: 'completed',
    reference: payload.reference || null,
    description: String(payload.description || 'Crédit portefeuille'),
  });

  return res.json({ success: true, balance: user.walletBalance });
}

export async function payWithWallet(userId, amount, orderId, description) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable.');
  const balance = user.walletBalance ?? 0;
  if (balance < amount) throw new Error('Solde portefeuille insuffisant.');

  user.walletBalance = balance - amount;
  await user.save();

  await WalletTransaction.create({
    userId: user._id,
    type: 'debit',
    amount,
    balanceAfter: user.walletBalance,
    status: 'completed',
    orderId,
    description: description || 'Paiement commande',
  });

  return user.walletBalance;
}
