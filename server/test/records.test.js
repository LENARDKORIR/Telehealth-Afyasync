import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/index.js';
import { ensureDatabaseSchema, pool } from '../src/db.js';
import { createPatient } from '../src/patients.js';
import { createUser, signToken } from '../src/auth.js';

describe('Lab results and documents', () => {
  let doctor;
  let patient;
  let doctorToken;
  let patientToken;

  before(async function () {
    this.timeout(10000);
    const suffix = Date.now();
    const doctorId = `test-doctor-${suffix}`;
    const patientId = `test-patient-${suffix}`;

    await ensureDatabaseSchema();

    doctor = await createUser({
      id: doctorId,
      name: 'Records Test Doctor',
      email: `records.doctor.${suffix}@example.com`,
      password: 'password123',
      role: 'doctor',
    });
    patient = await createUser({
      id: patientId,
      name: 'Records Test Patient',
      email: `records.patient.${suffix}@example.com`,
      password: 'password123',
      role: 'patient',
    });

    await createPatient({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: '+1 555 010 2222',
      dateOfBirth: '1990-01-01',
      gender: 'other',
      address: '100 Test Way',
      medicalHistory: [],
    });

    doctorToken = signToken(doctor);
    patientToken = signToken(patient);
  });

  after(async function () {
    this.timeout(5000);
    if (!doctor || !patient) return;

    await pool.query('DELETE FROM documents WHERE owner_id = $1 OR uploaded_by_id IN ($1, $2)', [patient.id, doctor.id]);
    await pool.query('DELETE FROM lab_results WHERE patient_id = $1 OR doctor_id = $2', [patient.id, doctor.id]);
    await pool.query('DELETE FROM audit_logs WHERE actor_id IN ($1, $2)', [patient.id, doctor.id]);
    await pool.query('DELETE FROM patients WHERE id = $1', [patient.id]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [patient.id, doctor.id]);
  });

  it('requires authentication for record collections', async function () {
    this.timeout(10000);
    const labs = await request(app).get('/api/lab-results');
    const documents = await request(app).get('/api/documents');
    const download = await request(app).get('/api/documents/missing/download');

    expect(labs.status).to.equal(401);
    expect(documents.status).to.equal(401);
    expect(download.status).to.equal(401);
  });

  it('lets providers create lab results', async function () {
    this.timeout(10000);
    const createRes = await request(app)
      .post('/api/lab-results')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patient.id,
        testName: 'A1C',
        resultValue: '5.4',
        unit: '%',
        referenceRange: '4.0-5.6',
        status: 'normal',
        resultDate: '2026-05-27',
      });

    expect(createRes.status).to.equal(201);
    expect(createRes.body.data).to.include({
      patientId: patient.id,
      doctorId: doctor.id,
      testName: 'A1C',
      resultValue: '5.4',
      status: 'normal',
    });

    const patientRes = await request(app)
      .get('/api/lab-results')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(patientRes.status).to.equal(200);
    expect(patientRes.body.data.some((item) => item.id === createRes.body.data.id)).to.equal(true);
  });

  it('lets patients upload and download their documents', async function () {
    this.timeout(10000);
    const content = Buffer.from('records document').toString('base64');
    const uploadRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        ownerId: patient.id,
        fileName: 'records-document.txt',
        mimeType: 'application/octet-stream',
        contentBase64: content,
        description: 'Records test document',
      });

    expect(uploadRes.status).to.equal(201);
    expect(uploadRes.body.data).to.include({
      ownerId: patient.id,
      uploadedById: patient.id,
      fileName: 'records-document.txt',
    });
    expect(uploadRes.body.data).not.to.have.property('contentBase64');

    const listRes = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(listRes.status).to.equal(200);
    expect(listRes.body.data.some((item) => item.id === uploadRes.body.data.id)).to.equal(true);
    expect(listRes.body.data[0]).not.to.have.property('contentBase64');

    const downloadRes = await request(app)
      .get(`/api/documents/${uploadRes.body.data.id}/download`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(downloadRes.status).to.equal(200);
    expect(downloadRes.headers['content-disposition']).to.include('records-document.txt');
    expect(downloadRes.body.toString()).to.equal('records document');
  });

  it('prevents patients from uploading to another patient record', async function () {
    this.timeout(10000);
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        ownerId: 'someone-else',
        fileName: 'not-allowed.txt',
        mimeType: 'text/plain',
        contentBase64: Buffer.from('nope').toString('base64'),
      });

    expect(res.status).to.equal(403);
  });
});
