/**
 * Barème officiel Livriko (Lokossa) — source de vérité serveur.
 */
export function calculateDeliveryFee(distanceKm) {
  const dist = Math.max(0.1, Math.round(Number(distanceKm) * 10) / 10);
  let rawFee = 300;

  if (dist <= 1) rawFee = 300;
  else if (dist <= 2) rawFee = 300 + (dist - 1) * 200;
  else if (dist <= 3) rawFee = 500 + (dist - 2) * 175;
  else if (dist <= 5) rawFee = 675 + (dist - 3) * 225;
  else if (dist <= 8) rawFee = 1125 + (dist - 5) * (475 / 3);
  else if (dist <= 12) rawFee = 1600 + (dist - 8) * 125;
  else rawFee = 2100 + (dist - 12) * 125;

  const deliveryFee = Math.max(300, Math.round(rawFee / 5) * 5);
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
