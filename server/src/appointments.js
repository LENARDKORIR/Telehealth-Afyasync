import { pool } from './db.js';

const toAppointment = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  appointmentDate: row.appointment_date,
  startTime: row.start_time,
  endTime: row.end_time,
  status: row.status,
  reason: row.reason,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listAppointmentsByPatient(patientId) {
  const result = await pool.query(
    `SELECT a.*, p.name AS patient_name
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date DESC, a.start_time DESC`,
    [patientId]
  );
  return result.rows.map(toAppointment);
}

export async function listAppointments() {
  const result = await pool.query(
    `SELECT a.*, p.name AS patient_name
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     ORDER BY a.appointment_date DESC, a.start_time DESC`
  );
  return result.rows.map(toAppointment);
}

export async function getAppointmentById(id) {
  const result = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
  return result.rows[0] ? toAppointment(result.rows[0]) : null;
}

export async function createAppointment(appointment) {
  const now = new Date().toISOString();
  const result = await pool.query(
    `INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, start_time, end_time, status, reason, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      appointment.id,
      appointment.patientId,
      appointment.doctorId,
      appointment.appointmentDate,
      appointment.startTime,
      appointment.endTime,
      appointment.status || 'scheduled',
      appointment.reason,
      appointment.notes || null,
      now,
      now,
    ]
  );
  return toAppointment(result.rows[0]);
}

export async function updateAppointment(id, appointment) {
  const existing = await getAppointmentById(id);
  if (!existing) return null;

  const merged = { ...existing, ...appointment, updatedAt: new Date().toISOString() };
  const result = await pool.query(
    `UPDATE appointments SET patient_id = $2, doctor_id = $3, appointment_date = $4, start_time = $5, end_time = $6, status = $7, reason = $8, notes = $9, updated_at = $10
     WHERE id = $1 RETURNING *`,
    [
      id,
      merged.patientId,
      merged.doctorId,
      merged.appointmentDate,
      merged.startTime,
      merged.endTime,
      merged.status,
      merged.reason,
      merged.notes,
      merged.updatedAt,
    ]
  );
  return toAppointment(result.rows[0]);
}

export async function deleteAppointment(id) {
  const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}
