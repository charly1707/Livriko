export function currentUser(req) {
  return req.session?.utilisateur || null;
}

export function currentUserId(req) {
  return currentUser(req)?.id || null;
}

export function requireAuth(req, res, next) {
  if (!currentUserId(req)) {
    return res.status(401).json({ success: false, message: 'Non authentifié.', error: 'Non authentifié' });
  }
  return next();
}

export function requireAdmin(req, res, next) {
  const role = currentUser(req)?.role;
  if (role !== 'admin' && role !== 'administrateur') {
    return res.status(403).json({ success: false, error: 'Accès admin requis' });
  }
  return next();
}
