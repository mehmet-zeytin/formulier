import { api } from './api';

import type {
  WerkorderFormData,
  Materiaal,
  Werkorder,
  WerkorderDetail,
  CreateDraftPayload,
  UpdateDraftPayload
} from '../types/Werkorder';

interface CreateWerkorderPayload {
  werkorder: WerkorderFormData;
  materialen: Materiaal[];
}

interface CreateResponse {
  message: string;
  id: number;
}

interface MessageResponse {
  message: string;
}

interface UploadFotoResponse {
  message: string;
  id: number;
  pad: string;
  genomen_op: string;
}

export const createWerkorder = async (
  payload: CreateWerkorderPayload
): Promise<CreateResponse> => {
  const response = await api.post<CreateResponse>(
    '/werkorders',
    payload
  );

  return response.data;
};

export const createDraft = async (
  payload: CreateDraftPayload
): Promise<CreateResponse> => {
  const response = await api.post<CreateResponse>(
    '/werkorders/drafts',
    payload
  );

  return response.data;
};

export const getDrafts = async (): Promise<Werkorder[]> => {
  const response = await api.get<Werkorder[]>(
    '/werkorders/drafts'
  );

  return response.data;
};

export const updateDraft = async (
  id: number,
  payload: UpdateDraftPayload
): Promise<MessageResponse> => {
  const response = await api.patch<MessageResponse>(
    `/werkorders/${id}`,
    payload
  );

  return response.data;
};

export const completeDraft = async (
  id: number
): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>(
    `/werkorders/${id}/complete`
  );

  return response.data;
};


export const updateDraftMaterialen = async (
  id: number,
  materialen: Materiaal[]
): Promise<MessageResponse> => {
  const response = await api.put<MessageResponse>(
    `/werkorders/${id}/materialen`,
    {
      materialen
    }
  );

  return response.data;
};



export const uploadFoto = async (
  werkorderId: number,
  file: File,
  beschrijving: string,
  genomenOp: string = new Date().toISOString()
): Promise<UploadFotoResponse> => {
  const formData = new FormData();

  formData.append('foto', file);
  formData.append('beschrijving', beschrijving);
  formData.append('genomen_op', genomenOp);

  const response = await api.post<UploadFotoResponse>(
    `/werkorders/${werkorderId}/fotos`,
    formData
  );

  return response.data;
};

export const getAllWerkorders = async (): Promise<Werkorder[]> => {
  const response = await api.get<Werkorder[]>(
    '/werkorders'
  );

  return response.data;
};

export const getWerkorderDetail = async (
  id: number
): Promise<WerkorderDetail> => {
  const response = await api.get<WerkorderDetail>(
    `/werkorders/${id}`
  );

  return response.data;
};

export const deleteFoto = async (
  werkorderId: number,
  fotoId: number
): Promise<MessageResponse> => {
  const response = await api.delete<MessageResponse>(
    `/werkorders/${werkorderId}/fotos/${fotoId}`
  );

  return response.data;
};