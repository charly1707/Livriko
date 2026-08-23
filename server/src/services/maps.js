export async function getRoute(fromLat, fromLng, toLat, toLng) {
  const apiUrl = (process.env.MAPS_API_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
  const url = `${apiUrl}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  const headers = { Accept: 'application/json' };
  if (process.env.MAPS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.MAPS_API_KEY}`;
  }

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15000),
  }).catch(() => {
    throw new Error('API GPS indisponible.');
  });

  if (!response.ok) {
    throw new Error('API GPS indisponible.');
  }

  const body = await response.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new Error('Réponse cartographique invalide.');
  }
  return body;
}
