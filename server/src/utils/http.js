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

export function sessionUser(user, extras = {}) {
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
    verificationStatus: user.verificationStatus || null,
    documentsValide: Boolean(user.documentsValide),
    rejectionReason: user.rejectionReason || null,
    selfiePhoto: user.selfiePhoto || null,
    cipPhoto: user.cipPhoto || null,
    vehiclePhoto: user.vehiclePhoto || null,
    vehiclePlate: user.vehiclePlate || null,
    vehicle: user.vehicle || null,
    city: user.city || null,
    lat: user.lat ?? null,
    lng: user.lng ?? null,
    address: user.address || '',
    statut: user.statut || 'actif',
    storeId: extras.storeId || null,
    store: extras.store || null,
  };
}

export function isAdmin(role) {
  return role === 'admin' || role === 'administrateur';
}

export function isSeller(role) {
  return role === 'vendeur' || role === 'restaurant';
}
