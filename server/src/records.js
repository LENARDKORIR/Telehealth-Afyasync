import { pool } from './db.js';

const toLabResult = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  testName: row.test_name,
  resultValue: row.result_value,
  unit: row.unit,
  referenceRange: row.reference_range,
  status: row.status,
  notes: row.notes,
  resultDate: row.result_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
});

const toDocument = (row) => ({
  id: row.id,
  ownerId: row.owner_id,
  uploadedById: row.uploaded_by_id,
  fileName: row.file_name,
  mimeType: row.mime_type,
  contentBase64: row.content_base64,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ownerName: row.owner_name,
  uploadedByName: row.uploaded_by_name,
});

export async function listLabResults() {
  const result = await pool.query(
    `SELECT lr.*, p.name AS patient_name, d.name AS doctor_name
     FROM lab_results lr
     LEFT JOIN patients p ON p.id = lr.patient_id
     LEFT JOIN users d ON d.id = lr.doctor_id
     ORDER BY lr.result_date DESC, lr.created_at DESC`
  );

  return result.rows.map(toLabResult);
}

export async function listLabResultsByPatient(patientId) {
  const result = await pool.query(
    `SELECT lr.*, p.name AS patient_name, d.name AS doctor_name
     FROM lab_results lr
     LEFT JOIN patients p ON p.id = lr.patient_id
     LEFT JOIN users d ON d.id = lr.doctor_id
     WHERE lr.patient_id = $1
     ORDER BY lr.result_date DESC, lr.created_at DESC`,
    [patientId]
  );

  return result.rows.map(toLabResult);
}

export async function createLabResult(labResult) {
  const now = new Date().toISOString();
  const result = await pool.query(
    `INSERT INTO lab_results (id, patient_id, doctor_id, test_name, result_value, unit, reference_range, status, notes, result_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      labResult.id,
      labResult.patientId,
      labResult.doctorId,
      labResult.testName,
      labResult.resultValue,
      labResult.unit || null,
      labResult.referenceRange || null,
      labResult.status || 'normal',
      labResult.notes || null,
      labResult.resultDate,
      now,
      now,
    ]
  );

  return toLabResult(result.rows[0]);
}

export async function listDocuments() {
  const result = await pool.query(
    `SELECT doc.*, COALESCE(owner_user.name, owner_patient.name) AS owner_name, uploader.name AS uploaded_by_name
     FROM documents doc
     LEFT JOIN users owner_user ON owner_user.id = doc.owner_id
     LEFT JOIN patients owner_patient ON owner_patient.id = doc.owner_id
     LEFT JOIN users uploader ON uploader.id = doc.uploaded_by_id
     ORDER BY doc.created_at DESC`
  );

  return result.rows.map(toDocument);
}

export async function listDocumentsByOwner(ownerId) {
  const result = await pool.query(
    `SELECT doc.*, COALESCE(owner_user.name, owner_patient.name) AS owner_name, uploader.name AS uploaded_by_name
     FROM documents doc
     LEFT JOIN users owner_user ON owner_user.id = doc.owner_id
     LEFT JOIN patients owner_patient ON owner_patient.id = doc.owner_id
     LEFT JOIN users uploader ON uploader.id = doc.uploaded_by_id
     WHERE doc.owner_id = $1
     ORDER BY doc.created_at DESC`,
    [ownerId]
  );

  return result.rows.map(toDocument);
}

export async function getDocumentById(id) {
  const result = await pool.query(
    `SELECT doc.*, COALESCE(owner_user.name, owner_patient.name) AS owner_name, uploader.name AS uploaded_by_name
     FROM documents doc
     LEFT JOIN users owner_user ON owner_user.id = doc.owner_id
     LEFT JOIN patients owner_patient ON owner_patient.id = doc.owner_id
     LEFT JOIN users uploader ON uploader.id = doc.uploaded_by_id
     WHERE doc.id = $1`,
    [id]
  );

  return result.rows[0] ? toDocument(result.rows[0]) : null;
}

export async function createDocument(document) {
  const now = new Date().toISOString();
  const result = await pool.query(
    `INSERT INTO documents (id, owner_id, uploaded_by_id, file_name, mime_type, content_base64, description, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      document.id,
      document.ownerId,
      document.uploadedById,
      document.fileName,
      document.mimeType,
      document.contentBase64,
      document.description || null,
      now,
      now,
    ]
  );

  return toDocument(result.rows[0]);
}
