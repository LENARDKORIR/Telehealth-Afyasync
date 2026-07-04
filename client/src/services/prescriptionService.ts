import api from './api';
import { ENDPOINTS } from '../utils/constants';
import type { Prescription } from '../types/prescription';

export const prescriptionService = {
  async getPrescriptions(): Promise<Prescription[]> {
    const response = await api.get<{ data: Prescription[] }>(ENDPOINTS.PRESCRIPTIONS);
    return response.data.data || [];
  },

  async requestRefill(id: string, notes: string): Promise<Prescription> {
    const response = await api.post<{ data: Prescription }>(ENDPOINTS.PRESCRIPTION_REFILL_REQUEST(id), {
      notes,
    });
    return response.data.data;
  },

  async completeRefill(id: string, notes: string): Promise<Prescription> {
    const response = await api.put<{ data: Prescription }>(ENDPOINTS.PRESCRIPTION_REFILL_COMPLETE(id), {
      notes,
    });
    return response.data.data;
  },
};
