import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const getDefaultApiBase = () => {
  if (typeof window === 'undefined') return '';
  return (window.location.origin || '').replace(/\/$/, '');
};

const buildApiUrl = (path: string) => `${API_BASE || getDefaultApiBase()}${path}`;

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#e2e8f0" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Livriko</text></svg>`,
  );

export function onImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = PLACEHOLDER_IMAGE;
}

export { buildApiUrl };
