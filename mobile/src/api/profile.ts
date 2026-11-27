import { api } from './client';
import type { DocType } from './orders';

export type SavedAddress = { city: string; address: string; neighborhood: string };

export type SavedProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  docType: DocType | null;
  docNumber: string | null;
  address: SavedAddress | null;
};

/** Datos guardados del usuario: contacto, documento y dirección de envío. */
export async function getProfile(): Promise<SavedProfile> {
  const data = await api<{ user: SavedProfile }>('/auth/me');
  return data.user;
}

export async function saveProfile(input: {
  phone: string;
  docType: DocType;
  docNumber: string;
  address: SavedAddress;
}): Promise<SavedProfile> {
  const data = await api<{ user: SavedProfile }>('/auth/profile', { method: 'PATCH', body: input });
  return data.user;
}
