export interface DeliveryFeeBreakdown {
  distanceKm: number;
  deliveryFee: number;
  driverEarnings: number; // 85%
  platformFee: number;    // 15%
  ratePerKm: number;
  tierLabel: string;
}

export interface DeliveryQuote extends DeliveryFeeBreakdown {
  storeLat: number;
  storeLng: number;
  clientLat: number;
  clientLng: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export function isValidCoordinates(lat: unknown, lng: unknown): lat is number {
  return typeof lat === 'number'
    && Number.isFinite(lat)
    && typeof lng === 'number'
    && Number.isFinite(lng)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180;
}

/**
 * Barème Livriko (Lokossa) — forfait livraison unique.
 * Frais de livraison fixes : 1 000 FCFA (indépendants de la distance GPS).
 * La distance reste calculée pour l’info course / affichage.
 */
export const FLAT_DELIVERY_FEE = 1000;

export function calculateDeliveryFee(distanceKm: number): DeliveryFeeBreakdown {
  const dist = Math.max(0.1, Math.round(distanceKm * 10) / 10);
  const deliveryFee = FLAT_DELIVERY_FEE;
  const driverEarnings = Math.round(deliveryFee * 0.85);
  const platformFee = deliveryFee - driverEarnings;
  const ratePerKm = Math.round(deliveryFee / dist);

  return {
    distanceKm: dist,
    deliveryFee,
    driverEarnings,
    platformFee,
    ratePerKm,
    tierLabel: 'Forfait livraison 1 000 FCFA',
  };
}

/**
 * Calculates GPS Haversine distance in kilometers between two lat/lng coordinates
 */
export function calculateRoadDistanceKm(
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined
): number | null {
  if (!isValidCoordinates(lat1, lng1) || !isValidCoordinates(lat2, lng2)) return null;
  return calculateHaversineDistance(lat1, lng1, lat2, lng2);
}

export function calculateHaversineDistance(
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined
): number | null {
  if (!isValidCoordinates(lat1, lng1) || !isValidCoordinates(lat2, lng2)) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  // Arrondi au 0,1 km (aligné serveur) — pas de plancher artificiel qui fausse les courtes distances.
  return Math.max(0.1, Math.round(distance * 10) / 10);
}

export function buildDeliveryQuoteFromCoordinates(
  storeLat: number | null | undefined,
  storeLng: number | null | undefined,
  clientLat: number | null | undefined,
  clientLng: number | null | undefined
): DeliveryQuote | null {
  if (!isValidCoordinates(storeLat, storeLng) || !isValidCoordinates(clientLat, clientLng)) return null;
  const distanceKm = calculateRoadDistanceKm(storeLat, storeLng, clientLat, clientLng);
  if (distanceKm === null) return null;
  const breakdown = calculateDeliveryFee(distanceKm);

  return {
    ...breakdown,
    storeLat,
    storeLng,
    clientLat,
    clientLng,
  };
}

/**
 * Format currency helper
 */
export function formatFCFA(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}
