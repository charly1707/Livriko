import { UserRole } from '../types';

export const normalizeUserRole = (role?: string): UserRole => {
  const value = (role || '').toLowerCase();

  if (value === 'administrateur' || value === 'admin') return 'admin';
  if (value === 'restaurant') return 'restaurant';
  if (value === 'vendeur') return 'vendeur';
  if (value === 'livreur') return 'livreur';
  return 'client';
};

