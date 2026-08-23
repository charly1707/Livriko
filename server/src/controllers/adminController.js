import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Conversation } from '../models/Conversation.js';
import { getPayload } from '../utils/http.js';
import { publicId, toObjectId } from '../utils/ids.js';
import { sessionUser } from '../utils/http.js';
import { ensureDefaultAdmin } from '../utils/ensureAdmin.js';

function serializeAdminUser(user) {
  return {
    id: publicId(user),
    name: `${user.prenom} ${user.nom}`.trim(),
    email: user.email,
    phone: user.telephone,
    role: user.role,
    avatar: user.avatar,
    city: user.city,
    vehicle: user.vehicle,
    verificationStatus: user.verificationStatus,
    documentsValide: Boolean(user.documentsValide),
    rejectionReason: user.rejectionReason,
    selfiePhoto: user.selfiePhoto,
    cipPhoto: user.cipPhoto,
    vehiclePhoto: user.vehiclePhoto,
    walletBalance: user.walletBalance ?? 0,
    statut: user.statut,
    createdAt: user.createdAt,
  };
}

export async function listUsers(req, res) {
  const payload = getPayload(req);
  const role = String(payload.role || '').trim();
  const filter = role ? { role } : {};
  if (payload.verificationStatus) {
    filter.verificationStatus = String(payload.verificationStatus);
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(500);
  return res.json({
    success: true,
    users: users.map(serializeAdminUser),
  });
}

export async function approveLivreur(req, res) {
  const userId = toObjectId(getPayload(req).userId || getPayload(req).id);
  if (!userId) {
    return res.status(400).json({ success: false, message: 'ID utilisateur invalide.' });
  }

  const user = await User.findById(userId);
  if (!user || user.role !== 'livreur') {
    return res.status(404).json({ success: false, message: 'Livreur introuvable.' });
  }

  user.verificationStatus = 'approved';
  user.documentsValide = true;
  user.rejectionReason = null;
  user.statut = 'actif';
  await user.save();

  return res.json({ success: true, user: serializeAdminUser(user) });
}

export async function rejectLivreur(req, res) {
  const payload = getPayload(req);
  const userId = toObjectId(payload.userId || payload.id);
  if (!userId) {
    return res.status(400).json({ success: false, message: 'ID utilisateur invalide.' });
  }

  const user = await User.findById(userId);
  if (!user || user.role !== 'livreur') {
    return res.status(404).json({ success: false, message: 'Livreur introuvable.' });
  }

  user.verificationStatus = 'rejected';
  user.documentsValide = false;
  user.rejectionReason = String(payload.reason || 'Dossier incomplet ou non conforme.').trim();
  await user.save();

  return res.json({ success: true, user: serializeAdminUser(user) });
}

export async function toggleStoreCertification(req, res) {
  const payload = getPayload(req);
  const storeId = toObjectId(payload.storeId || payload.id);
  if (!storeId) {
    return res.status(400).json({ success: false, message: 'ID boutique invalide.' });
  }

  const store = await Store.findById(storeId);
  if (!store) {
    return res.status(404).json({ success: false, message: 'Boutique introuvable.' });
  }

  if (payload.estCertifie != null) {
    store.estCertifie = String(payload.estCertifie) === 'true';
  } else {
    store.estCertifie = !store.estCertifie;
  }
  await store.save();

  return res.json({
    success: true,
    store: {
      id: publicId(store),
      isCertified: Boolean(store.estCertifie),
    },
  });
}

export async function deleteUserAccount(req, res) {
  const payload = getPayload(req);
  const targetId = toObjectId(payload.userId || payload.id);
  if (!targetId) {
    return res.status(400).json({ success: false, message: 'ID utilisateur invalide.' });
  }

  const user = await User.findById(targetId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }

  if (user.role === 'admin' || user.role === 'administrateur') {
    return res.status(403).json({ success: false, message: 'Impossible de supprimer un compte administrateur.' });
  }

  const store = await Store.findOne({ ownerId: user._id });
  if (store) {
    await Product.deleteMany({ storeId: store._id });
    await Store.deleteOne({ _id: store._id });
  }

  await Order.deleteMany({
    $or: [{ clientId: user._id }, { 'delivery.riderId': user._id }],
  });
  await Conversation.deleteMany({ participants: user._id });
  await user.deleteOne();

  return res.json({ success: true, message: 'Compte supprimé définitivement.' });
}

export async function seedAdmin(_req, res) {
  try {
    const result = await ensureDefaultAdmin();
    if (!result.ensured) {
      return res.status(400).json({
        success: false,
        message: 'Définissez ADMIN_PASSWORD dans les variables d’environnement Render.',
        email: result.email,
      });
    }

    const user = await User.findOne({ email: result.email });
    return res.json({
      success: true,
      message: result.created ? 'Compte admin créé.' : 'Compte admin synchronisé.',
      email: result.email,
      user: user ? sessionUser(user) : null,
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    return res.status(500).json({ success: false, message: 'Impossible d’initialiser le compte admin.' });
  }
}
