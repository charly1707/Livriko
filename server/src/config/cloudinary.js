import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

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
  console.warn('Cloudinary non configuré : ajoutez CLOUDINARY_URL ou CLOUDINARY_* dans .env');
}

export { cloudinary };

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_URL || (cloudName && apiKey && apiSecret));
}
