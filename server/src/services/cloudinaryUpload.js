import { Readable } from 'stream';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const ALLOWED_FOLDERS = new Set(['products', 'chat', 'avatars', 'stores', 'livreurs', 'misc']);

export function normalizeFolder(folder) {
  const value = String(folder || 'misc').trim().toLowerCase();
  return ALLOWED_FOLDERS.has(value) ? value : 'misc';
}

function uploadStream(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

export async function uploadImageBuffer(buffer, { folder = 'misc', filename = 'image' } = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary n’est pas configuré côté serveur.');
  }
  if (!buffer?.length) {
    throw new Error('Aucune image à envoyer.');
  }

  const safeFolder = normalizeFolder(folder);
  const result = await uploadStream(buffer, {
    folder: `livriko/${safeFolder}`,
    resource_type: 'image',
    public_id: `${safeFolder}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    overwrite: false,
    unique_filename: true,
    use_filename: true,
    filename_override: filename.replace(/[^\w.-]+/g, '_').slice(0, 80) || undefined,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}
