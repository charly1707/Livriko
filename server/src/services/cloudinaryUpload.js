import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { randomBytes } from 'crypto';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const ALLOWED_FOLDERS = new Set(['products', 'chat', 'avatars', 'stores', 'livreurs', 'misc']);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, '../../uploads');

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

function detectExtension(buffer, filename = '') {
  const fromName = path.extname(filename).replace('.', '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'webp';
  return 'jpg';
}

async function uploadImageLocally(buffer, { folder = 'misc', filename = 'image' } = {}) {
  const safeFolder = normalizeFolder(folder);
  const dir = path.join(uploadsRoot, safeFolder);
  await fs.promises.mkdir(dir, { recursive: true });

  const ext = detectExtension(buffer, filename);
  const fileName = `${safeFolder}_${Date.now()}_${randomBytes(6).toString('hex')}.${ext}`;
  const destination = path.join(dir, fileName);
  await fs.promises.writeFile(destination, buffer);

  return {
    url: `/backend/uploads/${safeFolder}/${fileName}`,
    publicId: null,
    width: null,
    height: null,
    format: ext,
    storage: 'local',
  };
}

export async function uploadImageBuffer(buffer, { folder = 'misc', filename = 'image' } = {}) {
  if (!buffer?.length) {
    throw new Error('Aucune image à envoyer.');
  }

  const safeFolder = normalizeFolder(folder);

  if (isCloudinaryConfigured()) {
    try {
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
        storage: 'cloudinary',
      };
    } catch (error) {
      console.warn('Cloudinary indisponible, fallback upload local:', error.message || error);
    }
  }

  return uploadImageLocally(buffer, { folder: safeFolder, filename });
}
