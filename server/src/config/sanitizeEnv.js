/**
 * Nettoie CLOUDINARY_URL avant le chargement du SDK Cloudinary.
 * Une valeur vide ou placeholder (ex. depuis .env.example) fait crasher le serveur au démarrage.
 */
const url = String(process.env.CLOUDINARY_URL || '').trim();
const looksLikePlaceholder = url.includes('API_KEY') || url.includes('API_SECRET') || url.includes('CLOUD_NAME');

if (!url || !url.startsWith('cloudinary://') || looksLikePlaceholder) {
  delete process.env.CLOUDINARY_URL;
}
