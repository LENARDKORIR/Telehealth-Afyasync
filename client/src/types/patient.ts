/**
 * Patient related types
 */

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address: string;
  medicalHistory?: string[];
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  symptoms: string[];
  prescription?: Prescription[];
  notes: string;
  recordDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  createdAt: string;
  expiryDate: string;
}

export interface PatientStats {
  totalPatients: number;
  appointmentsToday: number;
  pendingReports: number;
  criticalCases: number;
}
