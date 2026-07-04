export type PrescriptionStatus = 'active' | 'refill_requested' | 'refilled' | 'paused';

export interface Prescription {
  id: string;
  patientId: string;
  patientName?: string | null;
  doctorId: string;
  doctorName?: string | null;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: PrescriptionStatus;
  refillRequestedAt?: string | null;
  lastRefilledAt?: string | null;
  refillNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}
