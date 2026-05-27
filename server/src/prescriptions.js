import { pool } from './db.js';

const toPrescription = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  medicationName: row.medication_name,
  dosage: row.dosage,
  frequency: row.frequency,
  duration: row.duration,
  instructions: row.instructions,
  status: row.status,
  refillRequestedAt: row.refill_requested_at,
  lastRefilledAt: row.last_refilled_at,
  refillNotes: row.refill_notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
});

export async function listPrescriptionsByPatient(patientId) {
  const result = await pool.query(
    `SELECT pr.*, p.name AS patient_name, d.name AS doctor_name
     FROM prescriptions pr
     LEFT JOIN patients p ON p.id = pr.patient_id
     LEFT JOIN users d ON d.id = pr.doctor_id
     WHERE pr.patient_id = $1
     ORDER BY pr.created_at DESC`,
    [patientId]
  );

  return result.rows.map(toPrescription);
}

export async function listPrescriptions() {
  const result = await pool.query(
    `SELECT pr.*, p.name AS patient_name, d.name AS doctor_name
     FROM prescriptions pr
     LEFT JOIN patients p ON p.id = pr.patient_id
     LEFT JOIN users d ON d.id = pr.doctor_id
     ORDER BY pr.created_at DESC`
  );

  return result.rows.map(toPrescription);
}

export async function getPrescriptionById(id) {
  const result = await pool.query(
    `SELECT pr.*, p.name AS patient_name, d.name AS doctor_name
     FROM prescriptions pr
     LEFT JOIN patients p ON p.id = pr.patient_id
     LEFT JOIN users d ON d.id = pr.doctor_id
     WHERE pr.id = $1`,
    [id]
  );

  return result.rows[0] ? toPrescription(result.rows[0]) : null;
}

export async function requestRefill(id, notes = '') {
  const existing = await getPrescriptionById(id);
  if (!existing) {
    return null;
  }

  const result = await pool.query(
    `UPDATE prescriptions
     SET status = 'refill_requested', refill_requested_at = NOW(), refill_notes = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, notes || existing.refillNotes || null]
  );

  return toPrescription(result.rows[0]);
}

export async function markPrescriptionRefilled(id, notes = '') {
  const existing = await getPrescriptionById(id);
  if (!existing) {
    return null;
  }

  const result = await pool.query(
    `UPDATE prescriptions
     SET status = 'refilled', last_refilled_at = NOW(), refill_notes = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, notes || existing.refillNotes || null]
  );

  return toPrescription(result.rows[0]);
}
