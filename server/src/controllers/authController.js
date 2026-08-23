import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { currentUser, currentUserId } from '../middleware/auth.js';
import { getPayload, sessionUser } from '../utils/http.js';
import { defaultStoreCoordinates } from '../utils/geo.js';

const ALLOWED_ROLES = ['client', 'restaurant', 'vendeur', 'livreur'];

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
      ],
    });

    if (!utilisateur) {
      return res.status(401).json({ success: false, message: 'Informations incorrectes. Vérifiez votre email et votre mot de passe.' });
    }

    const ok = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Informations incorrectes. Vérifiez votre email et votre mot de passe.' });
    }

    if (utilisateur.statut !== 'actif') {
      return res.status(403).json({ success: false, message: 'Votre compte est inactif ou suspendu.' });
    }

    req.session.utilisateur = sessionUser(utilisateur);
    return res.json({ success: true, user: req.session.utilisateur });
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
      city: payload.ville || payload.city || 'Lokossa',
      documentsValide: role === 'livreur' ? false : true,
      verificationStatus: role === 'livreur' ? 'pending' : null,
      selfiePhoto: payload.selfie_photo || payload.selfiePhoto || null,
      cipPhoto: payload.cip_photo || payload.cipPhoto || null,
      vehiclePhoto: payload.vehicle_photo || payload.vehiclePhoto || null,
    });

    if (role === 'restaurant' || role === 'vendeur') {
      const coords = defaultStoreCoordinates(payload.lat, payload.lng);
      await Store.create({
        ownerId: utilisateur._id,
        nom: payload.restaurant_name || `${nom} Boutique`,
        adresse: payload.adresse || 'Centre-ville, Lokossa',
        ville: payload.ville || 'Lokossa',
        telephone,
        logo: payload.logo || null,
        category: payload.store_category || payload.category || 'restaurants',
        statut: 'approuve',
        lat: coords.lat,
        lng: coords.lng,
      });
    }

    req.session.utilisateur = sessionUser(utilisateur);
    return res.json({ success: true, user: req.session.utilisateur });
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
  if (!user || user.statut !== 'actif') {
    req.session.utilisateur = null;
    return res.json({ user: null });
  }

  req.session.utilisateur = sessionUser(user);
  return res.json({ user: req.session.utilisateur });
}

export async function updateProfile(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }

  if (payload.name || payload.prenom) user.prenom = String(payload.name || payload.prenom).trim();
  if (payload.nom) user.nom = String(payload.nom).trim();
  if (payload.phone || payload.telephone) user.telephone = String(payload.phone || payload.telephone).trim();
  if (payload.avatar != null) user.avatar = String(payload.avatar).trim() || null;
  if (payload.city || payload.ville) user.city = String(payload.city || payload.ville).trim();
  if (payload.vehicle) user.vehicle = String(payload.vehicle).trim();

  if (payload.newPassword || payload.mot_de_passe) {
    const next = String(payload.newPassword || payload.mot_de_passe);
    if (next.length < 8) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }
    user.motDePasse = await bcrypt.hash(next, 10);
  }

  await user.save();
  req.session.utilisateur = sessionUser(user);
  return res.json({ success: true, user: req.session.utilisateur });
}

export async function deleteMyAccount(req, res) {
  const userId = currentUserId(req);
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }
  if (user.role === 'admin' || user.role === 'administrateur') {
    return res.status(403).json({ success: false, message: 'Impossible de supprimer un compte administrateur.' });
  }

  const store = await Store.findOne({ ownerId: user._id });
  if (store) {
    const { Product } = await import('../models/Product.js');
    const { Order } = await import('../models/Order.js');
    await Product.deleteMany({ storeId: store._id });
    await Store.deleteOne({ _id: store._id });
  }

  const { Order } = await import('../models/Order.js');
  const { Conversation } = await import('../models/Conversation.js');
  await Order.deleteMany({
    $or: [{ clientId: user._id }, { 'delivery.riderId': user._id }],
  });
  await Conversation.deleteMany({ participants: user._id });
  await user.deleteOne();

  req.session.destroy(() => {
    res.clearCookie('livriko.sid');
    return res.json({ success: true, message: 'Compte supprimé définitivement.' });
  });
}
