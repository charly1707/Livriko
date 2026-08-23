export function getPayload(req) {
  return { ...(req.query || {}), ...(req.body || {}) };
}

export function parseJsonField(value, fallback = []) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function sessionUser(user) {
  return {
    id: String(user._id),
    prenom: user.prenom || '',
    nom: user.nom || '',
    nom_utilisateur: user.nomUtilisateur || '',
    email: user.email || '',
    telephone: user.telephone || '',
    role: user.role || 'client',
    avatar: user.avatar || null,
    walletBalance: Number(user.walletBalance || 0),
  };
}

export function isAdmin(role) {
  return role === 'admin' || role === 'administrateur';
}

export function isSeller(role) {
  return role === 'vendeur' || role === 'restaurant';
}
