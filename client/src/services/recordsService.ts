import api from './api';
import { ENDPOINTS } from '../utils/constants';
import type {
  ClinicalDocument,
  CareTimelineItem,
  CreateDocumentPayload,
  CreateLabResultPayload,
  LabResult,
} from '../types/record';

export const recordsService = {
  async getLabResults(): Promise<LabResult[]> {
    const response = await api.get<{ data: LabResult[] }>(ENDPOINTS.LAB_RESULTS);
    return response.data.data || [];
  },

  async createLabResult(payload: CreateLabResultPayload): Promise<LabResult> {
    const response = await api.post<{ data: LabResult }>(ENDPOINTS.LAB_RESULTS, payload);
    return response.data.data;
  },

  async getDocuments(): Promise<ClinicalDocument[]> {
    const response = await api.get<{ data: ClinicalDocument[] }>(ENDPOINTS.DOCUMENTS);
    return response.data.data || [];
  },

  async uploadDocument(payload: CreateDocumentPayload): Promise<ClinicalDocument> {
    const response = await api.post<{ data: ClinicalDocument }>(ENDPOINTS.DOCUMENTS, payload);
    return response.data.data;
  },

  async downloadDocument(id: string): Promise<Blob> {
    const response = await api.get<Blob>(ENDPOINTS.DOCUMENT_DOWNLOAD(id), {
      responseType: 'blob',
    });
    return response.data;
  },

  async getCareTimeline(patientId: string): Promise<CareTimelineItem[]> {
    const response = await api.get<{ data: CareTimelineItem[] }>(ENDPOINTS.CARE_TIMELINE(patientId));
    return response.data.data || [];
  },
};
