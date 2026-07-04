/**
 * Patient service
 */

import api from './api';
import { ENDPOINTS, STORES } from '../utils/constants';
import type { Patient, MedicalRecord } from '../types/patient';
import { db } from '../database/indexedDB';

export const patientService = {
  /**
   * Get all patients
   */
  async getAllPatients(): Promise<Patient[]> {
    try {
      const response = await api.get<{ data: Patient[] }>(ENDPOINTS.PATIENTS);
      const patients = response.data.data;

      // Save to IndexedDB
      for (const patient of patients) {
        await db.put(STORES.PATIENTS, { ...patient, timestamp: Date.now() });
      }

      return patients;
    } catch (error) {
      // Fallback to IndexedDB
      console.warn('Failed to fetch patients, using local data');
      return db.getAll<Patient>(STORES.PATIENTS);
    }
  },

  /**
   * Get patient by ID
   */
  async getPatient(id: string): Promise<Patient | null> {
    try {
      const response = await api.get<{ data: Patient }>(ENDPOINTS.PATIENT_DETAIL(id));
      const patient = response.data.data;

      // Save to IndexedDB
      await db.put(STORES.PATIENTS, { ...patient, timestamp: Date.now() });

      return patient;
    } catch (error) {
      // Fallback to IndexedDB
      console.warn('Failed to fetch patient, using local data');
      return (await db.get<Patient>(STORES.PATIENTS, id)) ?? null;
    }
  },

  /**
   * Create patient
   */
  async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const patient: Patient = {
      ...patientData,
      id: `patient-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local DB first
    await db.put(STORES.PATIENTS, { ...patient, timestamp: Date.now() });
    await db.addToSyncQueue(STORES.PATIENTS, 'create', patient);

    try {
      // Try to sync with server
      const response = await api.post<{ data: Patient }>(ENDPOINTS.PATIENTS, patient);
      return response.data.data;
    } catch (error) {
      console.warn('Offline: Patient will sync when online');
      return patient;
    }
  },

  /**
   * Update patient
   */
  async updatePatient(id: string, patientData: Partial<Patient>): Promise<Patient> {
    const updateData = {
      ...patientData,
      updatedAt: new Date().toISOString(),
    };

    // Update local DB first
    const existing = await db.get<Patient>(STORES.PATIENTS, id);
    if (existing) {
      await db.put(STORES.PATIENTS, { ...existing, ...updateData, timestamp: Date.now() });
    }
    await db.addToSyncQueue(STORES.PATIENTS, 'update', updateData);

    try {
      // Try to sync with server
      const response = await api.put<{ data: Patient }>(ENDPOINTS.PATIENT_DETAIL(id), updateData);
      return response.data.data;
    } catch (error) {
      console.warn('Offline: Patient update will sync when online');
      return { ...existing, ...updateData } as Patient;
    }
  },

  /**
   * Delete patient
   */
  async deletePatient(id: string): Promise<void> {
    // Delete from local DB first
    await db.delete(STORES.PATIENTS, id);
    await db.addToSyncQueue(STORES.PATIENTS, 'delete', { id });

    try {
      // Try to sync with server
      await api.delete(ENDPOINTS.PATIENT_DETAIL(id));
    } catch (error) {
      console.warn('Offline: Patient deletion will sync when online');
    }
  },

  /**
   * Get patient medical records
   */
  async getPatientRecords(patientId: string): Promise<MedicalRecord[]> {
    try {
      const response = await api.get<{ data: MedicalRecord[] }>(ENDPOINTS.PATIENT_RECORDS(patientId));
      const records = response.data.data;

      // Save to IndexedDB
      for (const record of records) {
        await db.put(STORES.MEDICAL_RECORDS, { ...record, timestamp: Date.now() });
      }

      return records;
    } catch (error) {
      // Fallback to IndexedDB
      const allRecords = await db.getAll<MedicalRecord>(STORES.MEDICAL_RECORDS);
      return allRecords.filter((r) => r.patientId === patientId);
    }
  },

  /**
   * Create medical record
   */
  async createMedicalRecord(recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalRecord> {
    const record: MedicalRecord = {
      ...recordData,
      id: `record-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local DB
    await db.put(STORES.MEDICAL_RECORDS, { ...record, timestamp: Date.now() });
    await db.addToSyncQueue(STORES.MEDICAL_RECORDS, 'create', record);

    try {
      const response = await api.post<{ data: MedicalRecord }>(ENDPOINTS.MEDICAL_RECORDS, record);
      return response.data.data;
    } catch (error) {
      console.warn('Offline: Medical record will sync when online');
      return record;
    }
  },
};
