import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface UploadImageResponse { url: string }
export interface UploadApi { uploadImage: (localUri: string) => Promise<UploadImageResponse> }

export const uploadApi: UploadApi = {
  uploadImage: async (localUri: string) => {
    // 1. Vérifier le type MIME
    const allowed = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = localUri.split('.').pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      throw { code: 'INVALID_TYPE', message: 'Format non supporté (jpg, jpeg, png, webp)' };
    }
    let mime = 'image/jpeg';
    if (ext === 'png') mime = 'image/png';
    if (ext === 'webp') mime = 'image/webp';

    // 2. Vérifier la taille
    const blob = await fetch(localUri).then(r => r.blob());
    if (blob.size > 5 * 1024 * 1024) {
      throw { code: 'FILE_TOO_LARGE', message: 'La photo ne doit pas dépasser 5 Mo' };
    }

    // 3. FormData
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      type: mime,
      name: 'upload.' + ext,
    } as any);

    const response = await axios.post(`${API_BASE_URL}/upload/image`, formData);
    return { url: response.data.url };
  },
};