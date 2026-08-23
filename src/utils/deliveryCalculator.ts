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
 * Calculates delivery fee based on automatic GPS distance in Lokossa
 * according to the official Livriko tariff grid:
 * - 1 km : 300 FCFA
 * - 2 km : 500 FCFA
 * - 3 km : 675 FCFA
 * - 5 km : 1 125 FCFA
 * - 8 km : 1 600 FCFA
 * - 12 km : 2 100 FCFA
 * 
 * Progressive linear interpolation is applied for intermediate distances (e.g. 2.7 km, 4.3 km, 9.5 km).
 */
export function calculateDeliveryFee(distanceKm: number): DeliveryFeeBreakdown {
  const dist = Math.max(0.1, Math.round(distanceKm * 10) / 10);
  let rawFee = 300;

  if (dist <= 1) {
    rawFee = 300;
  } else if (dist <= 2) {
    // 1 to 2 km: 300 -> 500 (+200 FCFA/km)
    rawFee = 300 + (dist - 1) * 200;
  } else if (dist <= 3) {
    // 2 to 3 km: 500 -> 675 (+175 FCFA/km)
    rawFee = 500 + (dist - 2) * 175;
  } else if (dist <= 5) {
    // 3 to 5 km: 675 -> 1125 (+225 FCFA/km)
    rawFee = 675 + (dist - 3) * 225;
  } else if (dist <= 8) {
    // 5 to 8 km: 1125 -> 1600 (+158.33 FCFA/km)
    rawFee = 1125 + (dist - 5) * (475 / 3);
  } else if (dist <= 12) {
    // 8 to 12 km: 1600 -> 2100 (+125 FCFA/km)
    rawFee = 1600 + (dist - 8) * 125;
  } else {
    // > 12 km: 2100 + 125 FCFA / extra km
    rawFee = 2100 + (dist - 12) * 125;
  }

  // Round fee to nearest 5 FCFA
  const deliveryFee = Math.max(300, Math.round(rawFee / 5) * 5);
  const driverEarnings = Math.round(deliveryFee * 0.85);
  const platformFee = deliveryFee - driverEarnings;

  let tierLabel = '1 km (300 FCFA)';
  if (dist > 12) tierLabel = '> 12 km (2 100+ FCFA)';
  else if (dist > 8) tierLabel = '8 à 12 km (1 600 - 2 100 FCFA)';
  else if (dist > 5) tierLabel = '5 à 8 km (1 125 - 1 600 FCFA)';
  else if (dist > 3) tierLabel = '3 à 5 km (675 - 1 125 FCFA)';
  else if (dist > 2) tierLabel = '2 à 3 km (500 - 675 FCFA)';
  else if (dist > 1) tierLabel = '1 à 2 km (300 - 500 FCFA)';

  const ratePerKm = Math.round(deliveryFee / dist);

  return {
    distanceKm: dist,
    deliveryFee,
    driverEarnings,
    platformFee,
    ratePerKm,
    tierLabel,
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
  return Math.max(0.3, Math.round(distance * 10) / 10);
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
