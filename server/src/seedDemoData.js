import { pool } from './db.js';
import { createUser, getUserByEmail } from './auth.js';

const demoUsers = [
  {
    id: 'demo-patient',
    name: 'Demo Patient',
    email: 'patient.demo@afyasyncc.com',
    password: 'DemoPatient123!',
    role: 'patient',
  },
  {
    id: 'demo-doctor',
    name: 'Demo Doctor',
    email: 'doctor.demo@afyasyncc.com',
    password: 'DemoDoctor123!',
    role: 'doctor',
  },
  {
    id: 'demo-admin',
    name: 'Demo Admin',
    email: 'admin.demo@afyasyncc.com',
    password: 'DemoAdmin123!',
    role: 'admin',
  },
];

const demoPatientProfile = {
  id: 'demo-patient',
  name: 'Demo Patient',
  email: 'patient.demo@afyasyncc.com',
  phone: '+1 555 010 1000',
  dateOfBirth: '1995-06-15',
  gender: 'female',
  bloodGroup: 'O+',
  address: '12 Demo Street, Health City',
  medicalHistory: ['Seasonal allergies', 'Mild asthma'],
  emergencyContact: '+1 555 010 1999',
};

const demoAppointments = [
  {
    id: 'demo-appointment-1',
    patientId: 'demo-patient',
    doctorId: 'demo-doctor',
    appointmentDate: '2026-05-14',
    startTime: '09:00 AM',
    endTime: '09:30 AM',
    status: 'scheduled',
    reason: 'General follow-up',
    notes: 'Discuss recent lab results and medication refill.',
  },
  {
    id: 'demo-appointment-2',
    patientId: 'demo-patient',
    doctorId: 'demo-doctor',
    appointmentDate: '2026-05-01',
    startTime: '02:00 PM',
    endTime: '02:30 PM',
    status: 'completed',
    reason: 'Routine checkup',
    notes: 'Vitals stable. Continue current care plan.',
  },
];

const demoMedicalRecords = [
  {
    id: 'demo-record-1',
    patientId: 'demo-patient',
    doctorId: 'demo-doctor',
    diagnosis: 'Seasonal allergy flare-up',
    symptoms: ['Sneezing', 'Watery eyes', 'Congestion'],
    prescription: 'Cetirizine 10mg once daily for 14 days',
    notes: 'Patient advised to avoid dust and pollen exposure.',
    recordDate: '2026-05-01',
  },
];

const demoPrescriptions = [
  {
    id: 'demo-prescription-1',
    patientId: 'demo-patient',
    doctorId: 'demo-doctor',
    medicationName: 'Cetirizine',
    dosage: '10 mg',
    frequency: 'Once daily',
    duration: '14 days',
    instructions: 'Take with water in the evening and avoid known allergy triggers.',
    status: 'active',
  },
];

const demoLabResults = [
  {
    id: 'demo-lab-1',
    patientId: 'demo-patient',
    doctorId: 'demo-doctor',
    testName: 'Complete Blood Count',
    resultValue: 'Within range',
    unit: '',
    referenceRange: 'Normal',
    status: 'normal',
    notes: 'No concerning abnormalities detected.',
    resultDate: '2026-05-02',
  },
];

const demoDocuments = [
  {
    id: 'demo-document-1',
    ownerId: 'demo-patient',
    uploadedById: 'demo-doctor',
    fileName: 'bloodwork-summary.pdf',
    mimeType: 'application/pdf',
    contentBase64: 'UERGIGRlbW8gZG9jdW1lbnQ=',
    description: 'Summary of the latest bloodwork review.',
  },
];

async function upsertDemoUser(user) {
  const existing = await getUserByEmail(user.email);
  if (existing) {
    return existing;
  }

  return createUser(user);
}

async function upsertDemoPatient(patient) {
  const now = new Date().toISOString();
  await pool.query(
    `
      INSERT INTO patients (
        id,
        name,
        email,
        phone,
        date_of_birth,
        gender,
        blood_group,
        address,
        medical_history,
        emergency_contact,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        date_of_birth = EXCLUDED.date_of_birth,
        gender = EXCLUDED.gender,
        blood_group = EXCLUDED.blood_group,
        address = EXCLUDED.address,
        medical_history = EXCLUDED.medical_history,
        emergency_contact = EXCLUDED.emergency_contact,
        updated_at = EXCLUDED.updated_at
    `,
    [
      patient.id,
      patient.name,
      patient.email,
      patient.phone,
      patient.dateOfBirth,
      patient.gender,
      patient.bloodGroup,
      patient.address,
      JSON.stringify(patient.medicalHistory ?? []),
      patient.emergencyContact ?? null,
      now,
      now,
    ]
  );
}

async function upsertDemoAppointment(appointment) {
  const now = new Date().toISOString();
  await pool.query(
    `
      INSERT INTO appointments (
        id,
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        status,
        reason,
        notes,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        patient_id = EXCLUDED.patient_id,
        doctor_id = EXCLUDED.doctor_id,
        appointment_date = EXCLUDED.appointment_date,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        status = EXCLUDED.status,
        reason = EXCLUDED.reason,
        notes = EXCLUDED.notes,
        updated_at = EXCLUDED.updated_at
    `,
    [
      appointment.id,
      appointment.patientId,
      appointment.doctorId,
      appointment.appointmentDate,
      appointment.startTime,
      appointment.endTime,
      appointment.status,
      appointment.reason,
      appointment.notes,
      now,
      now,
    ]
  );
}

async function upsertDemoMedicalRecord(record) {
  const now = new Date().toISOString();
  await pool.query(
    `
      INSERT INTO medical_records (
        id,
        patient_id,
        doctor_id,
        diagnosis,
        symptoms,
        prescription,
        notes,
        record_date,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5::text[], $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        patient_id = EXCLUDED.patient_id,
        doctor_id = EXCLUDED.doctor_id,
        diagnosis = EXCLUDED.diagnosis,
        symptoms = EXCLUDED.symptoms,
        prescription = EXCLUDED.prescription,
        notes = EXCLUDED.notes,
        record_date = EXCLUDED.record_date,
        updated_at = EXCLUDED.updated_at
    `,
    [
      record.id,
      record.patientId,
      record.doctorId,
      record.diagnosis,
      record.symptoms ?? [],
      record.prescription ?? null,
      record.notes,
      record.recordDate,
      now,
      now,
    ]
  );
}

async function upsertDemoPrescription(prescription) {
  const now = new Date().toISOString();
  await pool.query(
    `
      INSERT INTO prescriptions (
        id,
        patient_id,
        doctor_id,
        medication_name,
        dosage,
        frequency,
        duration,
        instructions,
        status,
        refill_requested_at,
        last_refilled_at,
        refill_notes,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        patient_id = EXCLUDED.patient_id,
        doctor_id = EXCLUDED.doctor_id,
        medication_name = EXCLUDED.medication_name,
        dosage = EXCLUDED.dosage,
        frequency = EXCLUDED.frequency,
        duration = EXCLUDED.duration,
        instructions = EXCLUDED.instructions,
        status = EXCLUDED.status,
        refill_requested_at = EXCLUDED.refill_requested_at,
        last_refilled_at = EXCLUDED.last_refilled_at,
        refill_notes = EXCLUDED.refill_notes,
        updated_at = EXCLUDED.updated_at
    `,
    [
      prescription.id,
      prescription.patientId,
      prescription.doctorId,
      prescription.medicationName,
      prescription.dosage,
      prescription.frequency,
      prescription.duration,
      prescription.instructions,
      prescription.status,
      prescription.refillRequestedAt ?? null,
      prescription.lastRefilledAt ?? null,
      prescription.refillNotes ?? null,
      now,
      now,
    ]
  );
}

async function upsertDemoLabResult(labResult) {
  const now = new Date().toISOString();
  await pool.query(
    `
      INSERT INTO lab_results (
        id,
        patient_id,
        doctor_id,
        test_name,
        result_value,
        unit,
        reference_range,
        status,
        notes,
        result_date,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        patient_id = EXCLUDED.patient_id,
        doctor_id = EXCLUDED.doctor_id,
        test_name = EXCLUDED.test_name,
        result_value = EXCLUDED.result_value,
        unit = EXCLUDED.unit,
        reference_range = EXCLUDED.reference_range,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        result_date = EXCLUDED.result_date,
        updated_at = EXCLUDED.updated_at
    `,
    [
      labResult.id,
      labResult.patientId,
      labResult.doctorId,
      labResult.testName,
      labResult.resultValue,
      labResult.unit ?? null,
      labResult.referenceRange ?? null,
      labResult.status,
      labResult.notes ?? null,
      labResult.resultDate,
      now,
      now,
    ]
  );
}

async function upsertDemoDocument(document) {
  const now = new Date().toISOString();
  await pool.query(
    `
      INSERT INTO documents (
        id,
        owner_id,
        uploaded_by_id,
        file_name,
        mime_type,
        content_base64,
        description,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        owner_id = EXCLUDED.owner_id,
        uploaded_by_id = EXCLUDED.uploaded_by_id,
        file_name = EXCLUDED.file_name,
        mime_type = EXCLUDED.mime_type,
        content_base64 = EXCLUDED.content_base64,
        description = EXCLUDED.description,
        updated_at = EXCLUDED.updated_at
    `,
    [
      document.id,
      document.ownerId,
      document.uploadedById,
      document.fileName,
      document.mimeType,
      document.contentBase64,
      document.description ?? null,
      now,
      now,
    ]
  );
}

export async function seedDemoData() {
  for (const user of demoUsers) {
    await upsertDemoUser(user);
  }

  await upsertDemoPatient(demoPatientProfile);

  for (const appointment of demoAppointments) {
    await upsertDemoAppointment(appointment);
  }

  for (const record of demoMedicalRecords) {
    await upsertDemoMedicalRecord(record);
  }

  for (const prescription of demoPrescriptions) {
    await upsertDemoPrescription(prescription);
  }

  for (const labResult of demoLabResults) {
    await upsertDemoLabResult(labResult);
  }

  for (const document of demoDocuments) {
    await upsertDemoDocument(document);
  }
}