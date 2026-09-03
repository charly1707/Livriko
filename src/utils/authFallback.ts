import { UserRole } from '../types';

export const SESSION_LOGGED_IN_KEY = 'livriko_is_logged_in';
export const SESSION_USER_ID_KEY = 'livriko_current_user_id';
export const SESSION_USER_SNAPSHOT_KEY = 'livriko_user_snapshot';
export const ACTIVE_ROLE_KEY = 'livriko_active_role';

export const normalizeUserRole = (role?: string): UserRole => {
  const value = (role || '').toLowerCase();

  if (value === 'administrateur' || value === 'admin') return 'admin';
  if (value === 'restaurant') return 'restaurant';
  if (value === 'vendeur') return 'vendeur';
  if (value === 'livreur') return 'livreur';
  return 'client';
};

export function readStoredActiveRole(): UserRole {
  try {
    const stored = localStorage.getItem(ACTIVE_ROLE_KEY);
    if (stored && ['client', 'restaurant', 'vendeur', 'livreur', 'admin'].includes(stored)) {
      return stored as UserRole;
    }
  } catch {
    // ignore storage errors
  }
  return 'client';
}

export function resolveActiveRole(userRole: UserRole, storedRole = readStoredActiveRole()): UserRole {
  const role = normalizeUserRole(userRole);
  const dashboardRole: UserRole = role === 'restaurant' ? 'vendeur' : role;
  const storedDashboardRole: UserRole = storedRole === 'restaurant' ? 'vendeur' : storedRole;

  if (role === 'admin') {
    return storedRole === 'client' ? 'client' : 'admin';
  }

  if (storedRole === 'client') {
    return 'client';
  }

  if (storedDashboardRole === dashboardRole) {
    return dashboardRole;
  }

  return dashboardRole === 'client' ? 'client' : dashboardRole;
}

export function readPersistedSession(): { isLoggedIn: boolean; userId: string | null } {
  try {
    const isLoggedIn = localStorage.getItem(SESSION_LOGGED_IN_KEY) === 'true';
    const userId = localStorage.getItem(SESSION_USER_ID_KEY);
    return { isLoggedIn: isLoggedIn && Boolean(userId), userId: userId || null };
  } catch {
    return { isLoggedIn: false, userId: null };
  }
}

export function readPersistedUserSnapshot(): {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
} | null {
  try {
    const raw = localStorage.getItem(SESSION_USER_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id) return null;
    return {
      id: String(parsed.id),
      name: String(parsed.name || parsed.email || 'Utilisateur'),
      email: String(parsed.email || ''),
      phone: parsed.phone ? String(parsed.phone) : undefined,
      role: normalizeUserRole(parsed.role),
      avatar: parsed.avatar ? String(parsed.avatar) : undefined,
    };
  } catch {
    return null;
  }
}

export function persistSession(user: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
}) {
  try {
    localStorage.setItem(SESSION_LOGGED_IN_KEY, 'true');
    localStorage.setItem(SESSION_USER_ID_KEY, user.id);
    localStorage.setItem(SESSION_USER_SNAPSHOT_KEY, JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    }));
  } catch {
    // ignore storage errors
  }
}

export function clearPersistedSession() {
  try {
    localStorage.removeItem(SESSION_LOGGED_IN_KEY);
    localStorage.removeItem(SESSION_USER_ID_KEY);
    localStorage.removeItem(SESSION_USER_SNAPSHOT_KEY);
    localStorage.removeItem('livriko_seen_welcome');
    sessionStorage.removeItem('livriko_session');
  } catch {
    // ignore storage errors
  }
}

