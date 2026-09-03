import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { currentUser, currentUserId } from '../middleware/auth.js';
import { getPayload, sessionUser, isSeller } from '../utils/http.js';
import { storePublicId } from '../utils/ids.js';

const ALLOWED_ROLES = ['client', 'restaurant', 'vendeur', 'livreur'];

async function buildSessionUser(utilisateur) {
  const extras = {};
  if (isSeller(utilisateur.role)) {
    const store = await Store.findOne({ ownerId: utilisateur._id });
    if (store) {
      extras.storeId = storePublicId(store);
      extras.store = {
        id: storePublicId(store),
        name: store.nom,
        category: store.category || 'restaurants',
        address: store.adresse,
        city: store.ville,
        phone: store.telephone,
        logo: store.logo,
        isOpen: store.statut !== 'ferme',
        isCertified: Boolean(store.estCertifie),
        lat: store.lat,
        lng: store.lng,
        ownerId: String(store.ownerId),
      };
    }
  }
  return sessionUser(utilisateur, extras);
}

export async function login(req, res) {
  try {
    const payload = getPayload(req);
    const identifiant = String(payload.identifiant || '').trim();
    const motDePasse = String(payload.mot_de_passe || '');

    if (!identifiant || !motDePasse) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }

    const utilisateur = await User.findOne({
      $or: [
        { email: identifiant.toLowerCase() },
        { nomUtilisateur: identifiant },
        { nomUtilisateur: new RegExp(`^${identifiant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
      deletedAt: null,
    });

    if (!utilisateur) {
      return res.status(401).json({ success: false, message: 'Informations incorrectes. Vérifiez votre email et votre mot de passe.' });
    }

    if (utilisateur.deletedAt) {
      return res.status(403).json({ success: false, message: 'Ce compte a été supprimé.' });
    }

    const ok = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Informations incorrectes. Vérifiez votre email et votre mot de passe.' });
    }

    if (utilisateur.statut !== 'actif') {
      return res.status(403).json({ success: false, message: 'Votre compte est inactif ou suspendu.' });
    }

    const session = await buildSessionUser(utilisateur);
    req.session.utilisateur = session;
    return res.json({ success: true, user: session });
  } catch (error) {
    console.error('Auth login error:', error);
    return res.status(500).json({ success: false, message: 'Une erreur interne est survenue.' });
  }
}

export async function register(req, res) {
  try {
    const payload = getPayload(req);
    const prenom = String(payload.prenom || '').trim();
    const nom = String(payload.nom || '').trim();
    const nomUtilisateur = String(payload.nom_utilisateur || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const telephone = String(payload.telephone || '').trim();
    const motDePasse = String(payload.mot_de_passe || '');
    const requestedRole = String(payload.role || 'client').trim();
    const role = ALLOWED_ROLES.includes(requestedRole) ? requestedRole : 'client';

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
      return res.status(409).json({ success: false, message: 'Un compte existe déjà avec cet e-mail ou ce nom d’utilisateur.' });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const utilisateur = await User.create({
      role,
      nom,
      prenom,
      nomUtilisateur,
      email,
      motDePasse: hashedPassword,
      telephone,
      avatar: payload.avatar || null,
      vehicle: payload.vehicle || null,
      vehiclePlate: payload.vehicle_plate || payload.vehiclePlate || null,
      city: payload.ville || payload.city || 'Lokossa',
      lat: Number.isFinite(Number(payload.lat)) ? Number(payload.lat) : null,
      lng: Number.isFinite(Number(payload.lng)) ? Number(payload.lng) : null,
      address: String(payload.adresse || payload.address || '').trim() || null,
      documentsValide: role === 'livreur' ? false : true,
      verificationStatus: role === 'livreur' ? 'pending' : null,
      selfiePhoto: payload.selfie_photo || payload.selfiePhoto || null,
      cipPhoto: payload.cip_photo || payload.cipPhoto || null,
      vehiclePhoto: payload.vehicle_photo || payload.vehiclePhoto || null,
    });

    let createdStore = null;
    if (role === 'restaurant' || role === 'vendeur') {
      const storeLat = Number.isFinite(Number(payload.lat)) ? Number(payload.lat) : null;
      const storeLng = Number.isFinite(Number(payload.lng)) ? Number(payload.lng) : null;
      createdStore = await Store.create({
        ownerId: utilisateur._id,
        nom: payload.restaurant_name || `${nom} Boutique`,
        adresse: payload.adresse || payload.address || '',
        ville: payload.ville || 'Lokossa',
        telephone,
        logo: payload.logo || null,
        category: payload.store_category || payload.category || 'restaurants',
        statut: 'approuve',
        lat: storeLat,
        lng: storeLng,
      });
    }

    const session = await buildSessionUser(utilisateur);
    req.session.utilisateur = session;
    return res.json({
      success: true,
      user: session,
      store: createdStore
        ? {
            id: storePublicId(createdStore),
            name: createdStore.nom,
            category: createdStore.category || 'restaurants',
            address: createdStore.adresse,
            city: createdStore.ville,
            phone: createdStore.telephone,
            logo: createdStore.logo,
            ownerId: String(createdStore.ownerId),
            isOpen: true,
            isCertified: false,
            lat: createdStore.lat,
            lng: createdStore.lng,
          }
        : null,
    });
  } catch (error) {
    console.error('Auth register error:', error);
    return res.status(500).json({ success: false, message: 'Une erreur interne est survenue pendant l’inscription.' });
  }
}

export async function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('livriko.sid');
    res.json({ success: true });
  });
}

export async function me(req, res) {
  const session = currentUser(req);
  if (!session?.id) {
    return res.json({ user: null });
  }

  const user = await User.findById(currentUserId(req));
  if (!user || user.statut !== 'actif' || user.deletedAt) {
    req.session.utilisateur = null;
    return res.json({ user: null });
  }

  const enriched = await buildSessionUser(user);
  req.session.utilisateur = enriched;
  return res.json({ user: enriched });
}

export async function updateProfile(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const user = await User.findById(userId);
  if (!user || user.deletedAt) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }

  if (payload.name || payload.prenom) user.prenom = String(payload.name || payload.prenom).trim();
  if (payload.nom) user.nom = String(payload.nom).trim();
  if (payload.phone || payload.telephone) user.telephone = String(payload.phone || payload.telephone).trim();
  if (payload.avatar != null) user.avatar = String(payload.avatar).trim() || null;
  if (payload.city || payload.ville) user.city = String(payload.city || payload.ville).trim();
  if (payload.vehicle) user.vehicle = String(payload.vehicle).trim();
  if (payload.vehicle_plate || payload.vehiclePlate) {
    user.vehiclePlate = String(payload.vehicle_plate || payload.vehiclePlate).trim();
  }
  if (payload.lat != null && payload.lat !== '') {
    const lat = Number(payload.lat);
    if (Number.isFinite(lat)) user.lat = lat;
  }
  if (payload.lng != null && payload.lng !== '') {
    const lng = Number(payload.lng);
    if (Number.isFinite(lng)) user.lng = lng;
  }
  if (payload.address || payload.adresse) {
    user.address = String(payload.address || payload.adresse).trim();
  }

  // Courier document updates / resubmission after reject or incomplete
  let docsUpdated = false;
  if (payload.selfie_photo || payload.selfiePhoto) {
    user.selfiePhoto = String(payload.selfie_photo || payload.selfiePhoto).trim();
    docsUpdated = true;
  }
  if (payload.cip_photo || payload.cipPhoto) {
    user.cipPhoto = String(payload.cip_photo || payload.cipPhoto).trim();
    docsUpdated = true;
  }
  if (payload.vehicle_photo || payload.vehiclePhoto) {
    user.vehiclePhoto = String(payload.vehicle_photo || payload.vehiclePhoto).trim();
    docsUpdated = true;
  }

  if (user.role === 'livreur' && docsUpdated && ['rejected', 'incomplete'].includes(user.verificationStatus)) {
    user.verificationStatus = 'pending';
    user.rejectionReason = null;
    user.documentsValide = false;
  }

  if (payload.newPassword || payload.mot_de_passe) {
    const next = String(payload.newPassword || payload.mot_de_passe);
    if (next.length < 8) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }
    const currentPassword = String(payload.currentPassword || payload.mot_de_passe_actuel || '');
    if (currentPassword) {
      const ok = await bcrypt.compare(currentPassword, user.motDePasse);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect.' });
      }
    }
    user.motDePasse = await bcrypt.hash(next, 10);
  }

  await user.save();
  const enriched = await buildSessionUser(user);
  req.session.utilisateur = enriched;
  return res.json({ success: true, user: enriched });
}

export async function deleteMyAccount(req, res) {
  const userId = currentUserId(req);
  const user = await User.findById(userId);
  if (!user || user.deletedAt) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }
  if (user.role === 'admin' || user.role === 'administrateur') {
    return res.status(403).json({ success: false, message: 'Impossible de supprimer un compte administrateur.' });
  }

  // Soft-delete: preserve historical orders, deactivate account
  user.statut = 'inactif';
  user.deletedAt = new Date();
  user.email = `deleted_${user._id}_${user.email}`;
  user.nomUtilisateur = `deleted_${user._id}_${user.nomUtilisateur}`;
  await user.save();

  const store = await Store.findOne({ ownerId: user._id });
  if (store) {
    store.statut = 'suspendu';
    await store.save();
    const { Product } = await import('../models/Product.js');
    await Product.updateMany({ storeId: store._id }, { enStock: false });
  }

  req.session.destroy(() => {
    res.clearCookie('livriko.sid');
    return res.json({ success: true, message: 'Compte désactivé. Les données historiques sont conservées.' });
  });
}
