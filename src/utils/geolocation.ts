export type GpsCoords = { lat: number; lng: number };

export function getGpsPosition(): Promise<GpsCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Autorisation GPS refusée. Activez la localisation dans le navigateur.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Délai GPS dépassé. Réessayez à l’air libre.'));
        } else {
          reject(new Error('Position GPS indisponible pour le moment.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 8000 },
    );
  });
}

export function watchGpsPosition(onChange: (coords: GpsCoords) => void, onError?: (message: string) => void) {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    onError?.('La géolocalisation n’est pas disponible sur cet appareil.');
    return () => undefined;
  }
  const watchId = navigator.geolocation.watchPosition(
    (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    (err) => onError?.(err.message || 'Position GPS indisponible.'),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
  );
  return () => navigator.geolocation.clearWatch(watchId);
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&zoom=18&addressdetails=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('reverse geocode failed');
    const data = await res.json();
    const label = String(data?.display_name || '').trim();
    return label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export async function captureActorPosition() {
  const coords = await getGpsPosition();
  const address = await reverseGeocode(coords.lat, coords.lng);
  return { ...coords, address };
}
