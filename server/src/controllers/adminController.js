import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Conversation } from '../models/Conversation.js';
import bcrypt from 'bcryptjs';
import { getPayload } from '../utils/http.js';
import { publicId, toObjectId } from '../utils/ids.js';

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
    vehiclePlate: user.vehiclePlate,
    verificationStatus: user.verificationStatus,
    documentsValide: Boolean(user.documentsValide),
    rejectionReason: user.rejectionReason,
    selfiePhoto: user.selfiePhoto,
    cipPhoto: user.cipPhoto,
    vehiclePhoto: user.vehiclePhoto,
    walletBalance: user.walletBalance ?? 0,
    statut: user.statut,
    deletedAt: user.deletedAt || null,
    createdAt: user.createdAt,
  };
}

export async function createAdminUser(req, res) {
  try {
    const payload = getPayload(req);
    const prenom = String(payload.prenom || '').trim();
    const nom = String(payload.nom || '').trim();
    const nomUtilisateur = String(payload.nom_utilisateur || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const telephone = String(payload.telephone || '').trim();
    const motDePasse = String(payload.mot_de_passe || '');

    if (!prenom || !nom || !nomUtilisateur || !email || !telephone || !motDePasse) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont obligatoires.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Adresse e-mail invalide.' });
    }

    if (motDePasse.length < 8) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    const exists = await User.findOne({
      $or: [{ email }, { nomUtilisateur }],
      deletedAt: null,
    });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Un compte existe déjà avec cet e-mail ou ce nom d\'utilisateur.' });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const user = await User.create({
      role: 'administrateur',
      nom,
      prenom,
      nomUtilisateur,
      email,
      motDePasse: hashedPassword,
      telephone,
      statut: 'actif',
      documentsValide: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Compte administrateur créé avec succès.',
      user: serializeAdminUser(user),
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    return res.status(500).json({ success: false, message: 'Impossible de créer le compte administrateur.' });
  }
}

export async function listUsers(req, res) {
  const payload = getPayload(req);
  const role = String(payload.role || '').trim();
  const includeDeleted = String(payload.includeDeleted || '') === 'true';
  const filter = {};
  if (role) filter.role = role;
  if (payload.verificationStatus) {
    filter.verificationStatus = String(payload.verificationStatus);
  }
  if (!includeDeleted) {
    filter.deletedAt = null;
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
  if (!user || user.role !== 'livreur' || user.deletedAt) {
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
  if (!user || user.role !== 'livreur' || user.deletedAt) {
    return res.status(404).json({ success: false, message: 'Livreur introuvable.' });
  }

  user.verificationStatus = 'rejected';
  user.documentsValide = false;
  user.rejectionReason = String(payload.reason || 'Dossier incomplet ou non conforme.').trim();
  await user.save();

  return res.json({ success: true, user: serializeAdminUser(user) });
}

export async function requestIncompleteLivreur(req, res) {
  const payload = getPayload(req);
  const userId = toObjectId(payload.userId || payload.id);
  if (!userId) {
    return res.status(400).json({ success: false, message: 'ID utilisateur invalide.' });
  }

  const user = await User.findById(userId);
  if (!user || user.role !== 'livreur' || user.deletedAt) {
    return res.status(404).json({ success: false, message: 'Livreur introuvable.' });
  }

  user.verificationStatus = 'incomplete';
  user.documentsValide = false;
  user.rejectionReason = String(
    payload.reason || 'Informations incomplètes. Merci de compléter votre dossier.',
  ).trim();
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

export async function deleteStore(req, res) {
  const payload = getPayload(req);
  const storeId = toObjectId(payload.storeId || payload.id);
  if (!storeId) {
    return res.status(400).json({ success: false, message: 'ID boutique invalide.' });
  }

  const hardDelete = String(payload.hardDelete || '') === 'true';
  const store = await Store.findById(storeId);
  if (!store) {
    return res.status(404).json({ success: false, message: 'Boutique introuvable.' });
  }

  if (!hardDelete) {
    store.statut = 'suspendu';
    await store.save();
    await Product.updateMany({ storeId: store._id }, { enStock: false });

    if (store.ownerId) {
      const owner = await User.findById(store.ownerId);
      if (owner && !owner.deletedAt && owner.role !== 'admin' && owner.role !== 'administrateur') {
        owner.statut = 'inactif';
        owner.deletedAt = new Date();
        owner.email = `deleted_${owner._id}_${owner.email}`;
        owner.nomUtilisateur = `deleted_${owner._id}_${owner.nomUtilisateur}`;
        await owner.save();
      }
    }

    return res.json({
      success: true,
      softDeleted: true,
      message: 'Boutique désactivée. Les historiques de commandes sont conservés.',
    });
  }

  await Product.deleteMany({ storeId: store._id });
  await Store.deleteOne({ _id: store._id });

  return res.json({
    success: true,
    hardDeleted: true,
    message: 'Boutique et catalogue supprimés définitivement.',
  });
}

export async function deleteUserAccount(req, res) {
  const payload = getPayload(req);
  const targetId = toObjectId(payload.userId || payload.id);
  if (!targetId) {
    return res.status(400).json({ success: false, message: 'ID utilisateur invalide.' });
  }

  const hardDelete = String(payload.hardDelete || '') === 'true';

  const user = await User.findById(targetId);
  if (!user || (user.deletedAt && !hardDelete)) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }

  if (user.role === 'admin' || user.role === 'administrateur') {
    return res.status(403).json({ success: false, message: 'Impossible de supprimer un compte administrateur.' });
  }

  if (!hardDelete) {
    // Soft delete — preserve historical orders
    user.statut = 'inactif';
    user.deletedAt = new Date();
    user.email = `deleted_${user._id}_${user.email}`;
    user.nomUtilisateur = `deleted_${user._id}_${user.nomUtilisateur}`;
    await user.save();

    const store = await Store.findOne({ ownerId: user._id });
    if (store) {
      store.statut = 'suspendu';
      await store.save();
      await Product.updateMany({ storeId: store._id }, { enStock: false });
    }

    return res.json({
      success: true,
      softDeleted: true,
      message: 'Compte désactivé. Les historiques de commandes sont conservés.',
    });
  }

  // Hard delete — privileged irreversible action
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

  return res.json({ success: true, hardDeleted: true, message: 'Compte et données associées définitivement supprimés.' });
}
