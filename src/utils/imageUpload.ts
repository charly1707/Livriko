import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const getDefaultApiBase = () => {
  if (typeof window === 'undefined') return '';
  return (window.location.origin || '').replace(/\/$/, '');
};

const buildApiUrl = (path: string) => `${API_BASE || getDefaultApiBase()}${path}`;

export type ImageUploadFolder = 'products' | 'chat' | 'avatars' | 'stores' | 'livreurs' | 'misc';

export async function uploadImageFile(
  file: File,
  folder: ImageUploadFolder = 'misc',
): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const res = await axios.post(
    buildApiUrl('/backend/index.php/api/upload/image'),
    formData,
    {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  if (!res.data?.success || !res.data.url) {
    throw new Error(res.data?.error || res.data?.message || 'Impossible d’envoyer l’image.');
  }

  return res.data.url;
}

export async function uploadImageInput(
  file: File | null | undefined,
  folder: ImageUploadFolder,
): Promise<string | null> {
  if (!file) return null;
  return uploadImageFile(file, folder);
}
