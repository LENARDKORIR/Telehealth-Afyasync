import { pool } from './db.js';

const toMedicalRecord = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  diagnosis: row.diagnosis,
  symptoms: row.symptoms || [],
  prescription: row.prescription,
  notes: row.notes,
  recordDate: row.record_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listMedicalRecordsByPatient(patientId) {
  const result = await pool.query(
    'SELECT * FROM medical_records WHERE patient_id = $1 ORDER BY record_date DESC',
    [patientId]
  );
  return result.rows.map(toMedicalRecord);
}

export async function getRecordById(id) {
  const result = await pool.query('SELECT * FROM medical_records WHERE id = $1', [id]);
  return result.rows[0] ? toMedicalRecord(result.rows[0]) : null;
}

export async function createMedicalRecord(record) {
  const now = new Date().toISOString();
  const result = await pool.query(
    `INSERT INTO medical_records (id, patient_id, doctor_id, diagnosis, symptoms, prescription, notes, record_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::text[], $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      record.id,
      record.patientId,
      record.doctorId,
      record.diagnosis,
      record.symptoms || [],
      record.prescription || null,
      record.notes,
      record.recordDate,
      now,
      now,
    ]
  );
  return toMedicalRecord(result.rows[0]);
}

export async function updateMedicalRecord(id, record) {
  const existing = await getRecordById(id);
  if (!existing) return null;

  const merged = { ...existing, ...record, updatedAt: new Date().toISOString() };
  const result = await pool.query(
    `UPDATE medical_records SET patient_id = $2, doctor_id = $3, diagnosis = $4, symptoms = $5::text[], prescription = $6, notes = $7, record_date = $8, updated_at = $9
     WHERE id = $1 RETURNING *`,
    [
      id,
      merged.patientId,
      merged.doctorId,
      merged.diagnosis,
      merged.symptoms || [],
      merged.prescription,
      merged.notes,
      merged.recordDate,
      merged.updatedAt,
    ]
  );
  return toMedicalRecord(result.rows[0]);
}

export async function deleteMedicalRecord(id) {
  const result = await pool.query('DELETE FROM medical_records WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}
