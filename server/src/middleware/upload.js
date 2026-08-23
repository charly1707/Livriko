import multer from 'multer';

const imageFilter = (_req, file, callback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return callback(new Error('Format d’image non pris en charge'));
  }
  callback(null, true);
};

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export function handleMulter(upload) {
  return (req, res, next) => {
    upload(req, res, (error) => {
      if (!error) return next();
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'L’image dépasse la taille maximale autorisée (5 Mo)'
        : error.message;
      return res.status(400).json({ error: message, success: false });
    });
  };
}
