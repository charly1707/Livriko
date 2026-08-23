import './sanitizeEnv.js';
import { v2 as cloudinary } from 'cloudinary';

const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
} else if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  console.warn('Cloudinary non configuré : définissez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET sur Render.');
}

export { cloudinary };

export function isCloudinaryConfigured() {
  return Boolean(
    (cloudName && apiKey && apiSecret)
    || process.env.CLOUDINARY_URL,
  );
}
