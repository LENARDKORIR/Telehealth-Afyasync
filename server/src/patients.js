import { pool } from './db.js';

const toPatient = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  dateOfBirth: row.date_of_birth,
  gender: row.gender,
  bloodGroup: row.blood_group,
  address: row.address,
  medicalHistory: row.medical_history ?? [],
  emergencyContact: row.emergency_contact,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeMedicalHistory = (medicalHistory) => {
  if (Array.isArray(medicalHistory)) {
    return medicalHistory;
  }

  return [];
};

export async function listPatients() {
  const result = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
  return result.rows.map(toPatient);
}

export async function getPatientById(id) {
  const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
  return result.rows[0] ? toPatient(result.rows[0]) : null;
}

export async function createPatient(patient) {
  const now = new Date().toISOString();
  const result = await pool.query(
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
      RETURNING *
    `,
    [
      patient.id,
      patient.name,
      patient.email,
      patient.phone,
      patient.dateOfBirth,
      patient.gender,
      patient.bloodGroup ?? null,
      patient.address,
      JSON.stringify(normalizeMedicalHistory(patient.medicalHistory)),
      patient.emergencyContact ?? null,
      now,
      now,
    ]
  );

  return toPatient(result.rows[0]);
}

export async function updatePatient(id, patient) {
  const existing = await getPatientById(id);
  if (!existing) {
    return null;
  }

  const merged = {
    ...existing,
    ...patient,
    medicalHistory: patient.medicalHistory ?? existing.medicalHistory ?? [],
    updatedAt: new Date().toISOString(),
  };

  const result = await pool.query(
    `
      UPDATE patients
      SET
        name = $2,
        email = $3,
        phone = $4,
        date_of_birth = $5,
        gender = $6,
        blood_group = $7,
        address = $8,
        medical_history = $9::jsonb,
        emergency_contact = $10,
        updated_at = $11
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      merged.name,
      merged.email,
      merged.phone,
      merged.dateOfBirth,
      merged.gender,
      merged.bloodGroup ?? null,
      merged.address,
      JSON.stringify(normalizeMedicalHistory(merged.medicalHistory)),
      merged.emergencyContact ?? null,
      merged.updatedAt,
    ]
  );

  return toPatient(result.rows[0]);
}

export async function deletePatient(id) {
  const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}