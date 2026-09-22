import {
  api
} from './api';

import type {
  WerkorderFormData,
  Materiaal,
  Werkorder,
  WerkorderDetail,
  CreateDraftPayload,
  UpdateDraftPayload,
  AssignmentHistoryItem
} from '../types/Werkorder';

interface CreateWerkorderPayload {
  werkorder:
    WerkorderFormData;

  materialen:
    Materiaal[];
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

interface WerkorderAccessResponse {
  userIds: number[];
}

export interface AssignableUser {
  id: number;

  email: string;

  role:
    | 'admin'
    | 'medewerker';
}

export const createWerkorder =
  async (
    payload:
      CreateWerkorderPayload
  ): Promise<CreateResponse> => {
    const response =
      await api.post<CreateResponse>(
        '/werkorders',
        payload
      );

    return response.data;
  };

export const createDraft =
  async (
    payload:
      CreateDraftPayload
  ): Promise<CreateResponse> => {
    const response =
      await api.post<CreateResponse>(
        '/werkorders/drafts',
        payload
      );

    return response.data;
  };

export const getDrafts =
  async (): Promise<
    Werkorder[]
  > => {
    const response =
      await api.get<Werkorder[]>(
        '/werkorders/drafts'
      );

    return response.data;
  };

export const updateDraft =
  async (
    id: number,

    payload:
      UpdateDraftPayload
  ): Promise<MessageResponse> => {
    const response =
      await api.patch<MessageResponse>(
        `/werkorders/${id}`,
        payload
      );

    return response.data;
  };

export const completeDraft =
  async (
    id: number
  ): Promise<MessageResponse> => {
    const response =
      await api.post<MessageResponse>(
        `/werkorders/${id}/complete`
      );

    return response.data;
  };

export const updateDraftMaterialen =
  async (
    id: number,
    materialen:
      Materiaal[]
  ): Promise<MessageResponse> => {
    const response =
      await api.put<MessageResponse>(
        `/werkorders/${id}/materialen`,
        {
          materialen
        }
      );

    return response.data;
  };

export const uploadFoto =
  async (
    werkorderId: number,

    file: File,

    beschrijving:
      string,

    genomenOp:
      string =
        new Date()
          .toISOString()
  ): Promise<
    UploadFotoResponse
  > => {
    const formData =
      new FormData();

    formData.append(
      'foto',
      file
    );

    formData.append(
      'beschrijving',
      beschrijving
    );

    formData.append(
      'genomen_op',
      genomenOp
    );

    const response =
      await api.post<
        UploadFotoResponse
      >(
        `/werkorders/${werkorderId}/fotos`,
        formData
      );

    return response.data;
  };

export const getAllWerkorders =
  async (): Promise<
    Werkorder[]
  > => {
    const response =
      await api.get<Werkorder[]>(
        '/werkorders'
      );

    return response.data;
  };

export const getWerkorderDetail =
  async (
    id: number
  ): Promise<
    WerkorderDetail
  > => {
    const response =
      await api.get<
        WerkorderDetail
      >(
        `/werkorders/${id}`
      );

    return response.data;
  };

export const deleteFoto =
  async (
    werkorderId: number,
    fotoId: number
  ): Promise<MessageResponse> => {
    const response =
      await api.delete<
        MessageResponse
      >(
        `/werkorders/${werkorderId}/fotos/${fotoId}`
      );

    return response.data;
  };

export const transferWerkorder =
  async (
    werkorderId: number,

    userId: number,

    reason: string
  ): Promise<MessageResponse> => {
    const response =
      await api.patch<
        MessageResponse
      >(
        `/werkorders/${werkorderId}/assignee`,
        {
          userId,
          reason
        }
      );

    return response.data;
  };

export const getWerkorderAccess =
  async (
    werkorderId: number
  ): Promise<number[]> => {
    const response =
      await api.get<
        WerkorderAccessResponse
      >(
        `/werkorders/${werkorderId}/access`
      );

    return (
      response.data.userIds
    );
  };

export const updateWerkorderAccess =
  async (
    werkorderId: number,

    userIds: number[]
  ): Promise<MessageResponse> => {
    const response =
      await api.put<
        MessageResponse
      >(
        `/werkorders/${werkorderId}/access`,
        {
          userIds
        }
      );

    return response.data;
  };

export const getAssignableUsers =
  async (): Promise<
    AssignableUser[]
  > => {
    const response =
      await api.get<
        AssignableUser[]
      >(
        '/werkorders/assignable-users'
      );

    return response.data;
  };
  
export const getFotoBlob =
  async (
    werkorderId: number,
    fotoId: number
  ): Promise<Blob> => {
    const response =
      await api.get<Blob>(
        `/werkorders/${werkorderId}/fotos/${fotoId}/file`,
        {
          responseType: 'blob'
        }
      );

    return response.data;
  };

export const getAssignmentHistory =
  async (
    werkorderId: number
  ): Promise<
    AssignmentHistoryItem[]
  > => {
    const response =
      await api.get<
        AssignmentHistoryItem[]
      >(
        `/werkorders/${werkorderId}/assignment-history`
      );

    return response.data;
  };

  export const deleteWerkorder =
  async (
    werkorderId: number
  ): Promise<MessageResponse> => {
    const response =
      await api.delete<
        MessageResponse
      >(
        `/werkorders/${werkorderId}`
      );

    return response.data;
  };

  export const getTrashWerkorders =
  async (): Promise<Werkorder[]> => {
    const response =
      await api.get<Werkorder[]>(
        '/werkorders/trash'
      );

    return response.data;
  };


  export const restoreWerkorder =
    async (
      werkorderId: number
    ): Promise<MessageResponse> => {
      const response =
        await api.patch<MessageResponse>(
          `/werkorders/${werkorderId}/restore`
        );

      return response.data;
    };


  export const deleteWerkorderPermanently =
    async (
      werkorderId: number
    ): Promise<MessageResponse> => {
      const response =
        await api.delete<MessageResponse>(
          `/werkorders/${werkorderId}/permanent`
        );

      return response.data;
    };