import { Newsletter } from '../models/Newsletter.js';
import { getPayload } from '../utils/http.js';

export async function subscribe(req, res) {
  const payload = getPayload(req);
  const contact = String(payload.contact || '').trim();
  if (!contact) {
    return res.status(400).json({ success: false, message: 'Un e-mail ou un numéro WhatsApp est requis.' });
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const normalizedContact = isEmail ? contact.toLowerCase() : contact.replace(/\s+/g, ' ');
  const contactType = isEmail ? 'email' : 'whatsapp';

  if (contactType === 'whatsapp' && !/^\+?[0-9][0-9\s().-]{7,24}$/.test(normalizedContact)) {
    return res.status(422).json({ success: false, message: 'Indiquez un e-mail ou un numéro WhatsApp valide.' });
  }

  try {
    await Newsletter.findOneAndUpdate(
      { contact: normalizedContact },
      { contact: normalizedContact, contactType, status: 'active' },
      { upsert: true, new: true },
    );
    return res.json({ success: true, message: 'Inscription enregistrée.' });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(503).json({ success: false, message: 'Inscription indisponible pour le moment.' });
  }
}
