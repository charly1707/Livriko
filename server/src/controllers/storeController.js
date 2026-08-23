import { Store } from '../models/Store.js';
import { publicId } from '../utils/ids.js';

export async function listStores(_req, res) {
  try {
    const restaurants = await Store.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      restaurants: restaurants.map((restaurant) => ({
        id: publicId(restaurant),
        name: restaurant.nom,
        ownerId: String(restaurant.ownerId),
        address: restaurant.adresse,
        city: restaurant.ville,
        phone: restaurant.telephone,
        momoPhone: restaurant.momoPhone,
        logo: restaurant.logo,
        isOpen: restaurant.statut === 'approuve',
        isCertified: Boolean(restaurant.estCertifie),
        description: restaurant.description,
        lat: restaurant.lat,
        lng: restaurant.lng,
      })),
    });
  } catch (error) {
    console.error('Restaurant listing error:', error);
    return res.status(503).json({ success: false, message: 'Impossible de récupérer les boutiques.' });
  }
}
