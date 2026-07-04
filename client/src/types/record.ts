export type LabResultStatus = 'normal' | 'abnormal' | 'critical';

export interface LabResult {
  id: string;
  patientId: string;
  patientName?: string | null;
  doctorId: string;
  doctorName?: string | null;
  testName: string;
  resultValue: string;
  unit?: string | null;
  referenceRange?: string | null;
  status: LabResultStatus;
  notes?: string | null;
  resultDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabResultPayload {
  patientId: string;
  testName: string;
  resultValue: string;
  unit?: string;
  referenceRange?: string;
  status: LabResultStatus;
  notes?: string;
  resultDate: string;
}

export interface ClinicalDocument {
  id: string;
  ownerId: string;
  ownerName?: string | null;
  uploadedById: string;
  uploadedByName?: string | null;
  fileName: string;
  mimeType: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentPayload {
  ownerId: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
  description?: string;
}
