import { currentUserId } from '../middleware/auth.js';
import { getPayload } from '../utils/http.js';
import { getRoute } from '../services/maps.js';

export async function route(req, res) {
  if (!currentUserId(req)) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  const payload = getPayload(req);
  const values = ['fromLat', 'fromLng', 'toLat', 'toLng'];
  for (const value of values) {
    if (payload[value] == null || Number.isNaN(Number(payload[value]))) {
      return res.status(400).json({ success: false, message: 'Coordonnées GPS invalides.' });
    }
  }

  try {
    const routeData = await getRoute(
      Number(payload.fromLat),
      Number(payload.fromLng),
      Number(payload.toLat),
      Number(payload.toLng),
    );
    return res.json({ success: true, route: routeData });
  } catch (error) {
    return res.status(503).json({ success: false, message: error.message });
  }
}
