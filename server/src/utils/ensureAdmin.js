import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

function adminIdentityFromEmail(email) {
  const localPart = email.split('@')[0] || 'admin';
  const capitalized = localPart.charAt(0).toUpperCase() + localPart.slice(1);
  return {
    prenom: capitalized,
    nom: 'Admin',
    nomUtilisateur: localPart.replace(/[^a-zA-Z0-9_]/g, '_') || 'livriko_admin',
  };
}

export async function ensureDefaultAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '').trim();

  if (!email) {
    console.warn('ADMIN_EMAIL manquant : le compte administrateur n\'a pas été initialisé.');
    return { ensured: false, email: null, reason: 'missing_email' };
  }

  if (!password) {
    console.warn(`ADMIN_PASSWORD manquant : le compte admin (${email}) n'a pas été initialisé.`);
    return { ensured: false, email, reason: 'missing_password' };
  }

  await User.updateMany(
    {
      role: { $in: ['admin', 'administrateur'] },
      email: { $ne: email },
    },
    { $set: { role: 'client' } },
  );

  const hashedPassword = await bcrypt.hash(password, 10);
  const identity = adminIdentityFromEmail(email);
  let user = await User.findOne({ email });

  if (user) {
    user.role = 'administrateur';
    user.motDePasse = hashedPassword;
    user.statut = 'actif';
    user.documentsValide = true;
    user.prenom = user.prenom || identity.prenom;
    user.nom = user.nom || identity.nom;
    await user.save();
    console.log(`Compte administrateur synchronisé : ${email}`);
    return { ensured: true, email, created: false };
  }

  user = await User.create({
    role: 'administrateur',
    email,
    motDePasse: hashedPassword,
    telephone: process.env.ADMIN_PHONE || '+22900000000',
    statut: 'actif',
    documentsValide: true,
    ...identity,
  });

  console.log(`Compte administrateur créé : ${email}`);
  return { ensured: true, email, created: true };
}
