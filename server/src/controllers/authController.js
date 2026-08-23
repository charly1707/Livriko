import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { currentUser, currentUserId } from '../middleware/auth.js';
import { getPayload, sessionUser } from '../utils/http.js';

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
      vehicle: payload.vehicle || null,
      city: payload.ville || payload.city || 'Lokossa',
      documentsValide: role === 'livreur' ? false : true,
      verificationStatus: role === 'livreur' ? 'pending' : null,
    });

    if (role === 'restaurant' || role === 'vendeur') {
      await Store.create({
        ownerId: utilisateur._id,
        nom: payload.restaurant_name || `${nom} Boutique`,
        adresse: payload.adresse || 'Non renseignée',
        ville: payload.ville || 'Lokossa',
        telephone,
        logo: payload.logo || null,
        statut: 'approuve',
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
