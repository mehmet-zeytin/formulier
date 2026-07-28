import { api } from './api';
import type { WerkorderFormData, Materiaal } from '../types/Werkorder';

interface CreateWerkorderPayload {
  werkorder: WerkorderFormData;
  materialen: Materiaal[];
}

export const createWerkorder = async (payload: CreateWerkorderPayload) => {
  const response = await api.post('/werkorders', payload);
  return response.data;
};

export const uploadFoto = async (werkorderId: number, file: File, beschrijving: string) => {
  const formData = new FormData();
  formData.append('foto', file);
  formData.append('beschrijving', beschrijving);

  const response = await api.post(`/werkorders/${werkorderId}/fotos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAllWerkorders = async () => {
  const response = await api.get('/werkorders');
  return response.data;
};

export const getWerkorderDetail = async (id: number) => {
  const response = await api.get(`/werkorders/${id}`);
  return response.data;
};