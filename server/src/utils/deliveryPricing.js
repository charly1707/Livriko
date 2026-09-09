/**
 * Barème Livriko (Lokossa) — forfait livraison unique.
 * Frais de livraison fixes : 1 000 FCFA (indépendants de la distance GPS).
 * La distance reste calculée pour l’info course / affichage.
 */
export const FLAT_DELIVERY_FEE = 1000;

export function calculateDeliveryFee(distanceKm) {
  const dist = Math.max(0.1, Math.round(Number(distanceKm) * 10) / 10);
  const deliveryFee = FLAT_DELIVERY_FEE;
  const driverEarnings = Math.round(deliveryFee * 0.85);
  const platformFee = deliveryFee - driverEarnings;

  return { distanceKm: dist, deliveryFee, driverEarnings, platformFee };
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function isValidLatLng(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= -90 && a <= 90 && b >= -180 && b <= 180;
}
