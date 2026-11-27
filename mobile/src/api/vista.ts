import { api } from './client';
import { API_URL } from '../config';

export type VistaGarment = {
  sku: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
  size: string;
};

export type VistaSession = {
  id: string;
  garments: VistaGarment[];
};

export type VistaLook = {
  id: string;
  imageUrl: string;
  skus: string[];
  createdAt: string;
};

/** Paso 1 y 4: sesión del probador con las prendas del carrito. */
export function startTryOn(skus: string[]) {
  return api<VistaSession>('/vista/tryons', {
    method: 'POST',
    body: { skus },
    skipAuth: false,
  });
}

/** Paso 6: guarda la imagen del look solo si el usuario lo decide. */
export function saveLook(sessionId: string, imageBase64: string) {
  return api<{ id: string; imageUrl: string; createdAt: string }>(
    `/vista/tryons/${encodeURIComponent(sessionId)}/result`,
    {
      method: 'POST',
      body: { imageBase64 },
    },
  );
}

/** Historial de looks guardados del usuario. */
export function listLooks() {
  return api<{ looks: VistaLook[] }>('/vista/tryons');
}

/** URL completa de una imagen de look guardada en el backend. */
export function lookUrl(path: string) {
  return `${API_URL}${path}`;
}

export type VistaJobStatus = {
  jobId: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  resultUrl: string | null;
  error: string | null;
};

/** Inicia la generación del look con IA. La foto va en base64 (JPEG). */
export function generateLook(photoBase64: string, skus: string[]) {
  return api<{ jobId: string; status: string }>('/vista/generate', {
    method: 'POST',
    body: { photo: photoBase64, skus },
  });
}

/** Estado de la generación; la app consulta hasta que esté "done" o "failed". */
export function getLookJob(jobId: string) {
  return api<VistaJobStatus>(`/vista/jobs/${encodeURIComponent(jobId)}`);
}
