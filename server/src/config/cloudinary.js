import { v2 as cloudinary } from 'cloudinary';

function readCloudinaryEnv() {
  return {
    cloudName: String(process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    apiKey: String(process.env.CLOUDINARY_API_KEY || '').trim(),
    apiSecret: String(process.env.CLOUDINARY_API_SECRET || '').trim(),
    cloudinaryUrl: String(process.env.CLOUDINARY_URL || '').trim(),
  };
}

export function configureCloudinary() {
  const { cloudName, apiKey, apiSecret, cloudinaryUrl } = readCloudinaryEnv();

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }

  if (
    cloudinaryUrl
    && cloudinaryUrl.startsWith('cloudinary://')
    && !cloudinaryUrl.includes('API_KEY')
    && !cloudinaryUrl.includes('API_SECRET')
    && !cloudinaryUrl.includes('CLOUD_NAME')
  ) {
    cloudinary.config({ secure: true });
    return Boolean(cloudinary.config().api_key);
  }

  console.warn('Cloudinary non configuré : définissez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET (ou CLOUDINARY_URL).');
  return false;
}

export function isCloudinaryConfigured() {
  const cfg = cloudinary.config();
  if (cfg?.cloud_name && cfg?.api_key && cfg?.api_secret) {
    return true;
  }
  return configureCloudinary();
}

export { cloudinary };
