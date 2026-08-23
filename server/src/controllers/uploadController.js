import { getPayload } from '../utils/http.js';
import { uploadImageBuffer, normalizeFolder } from '../services/cloudinaryUpload.js';

export async function uploadRegisterImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Aucune image sélectionnée.' });
  }

  try {
    const uploaded = await uploadImageBuffer(req.file.buffer, {
      folder: 'misc',
      filename: req.file.originalname || 'register',
    });
    return res.json({ success: true, url: uploaded.url });
  } catch (error) {
    console.error('Register upload error:', error);
    return res.status(503).json({ success: false, error: error.message || 'Upload impossible.' });
  }
}

export async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Aucune image sélectionnée ou upload interrompu' });
  }

  const payload = getPayload(req);
  const folder = normalizeFolder(payload.folder || payload.type);

  try {
    const uploaded = await uploadImageBuffer(req.file.buffer, {
      folder,
      filename: req.file.originalname || 'image',
    });
    return res.json({ success: true, url: uploaded.url, ...uploaded });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(503).json({
      success: false,
      error: error.message || 'Impossible d’envoyer l’image sur Cloudinary.',
    });
  }
}
