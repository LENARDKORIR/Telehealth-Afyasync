import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/index.js';
import { ensureDatabaseSchema, pool } from '../src/db.js';
import { createUser, signToken } from '../src/auth.js';

describe('Appointment requests', () => {
  let doctor;
  let patient;
  let doctorToken;
  let patientToken;

  before(async function () {
    this.timeout(30000);
    const suffix = Date.now();

    await ensureDatabaseSchema();

    doctor = await createUser({
      id: `request-doctor-${suffix}`,
      name: 'Request Doctor',
      email: `request.doctor.${suffix}@example.com`,
      password: 'password123',
      role: 'doctor',
    });
    patient = await createUser({
      id: `request-patient-${suffix}`,
      name: 'Request Patient',
      email: `request.patient.${suffix}@example.com`,
      password: 'password123',
      role: 'patient',
    });

    doctorToken = signToken(doctor);
    patientToken = signToken(patient);
  });

  after(async function () {
    this.timeout(5000);
    if (!doctor || !patient) return;

    await pool.query('DELETE FROM appointments WHERE doctor_id = $1 OR patient_id = $2', [doctor.id, patient.id]);
    await pool.query('DELETE FROM audit_logs WHERE actor_id IN ($1, $2)', [doctor.id, patient.id]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [doctor.id, patient.id]);
  });

  it('requires authentication', async function () {
    this.timeout(10000);

    const res = await request(app)
      .post('/api/appointments/request')
      .send({
        doctorId: doctor.id,
        appointmentDate: '2026-06-10',
        startTime: '09:00',
        endTime: '10:00',
        reason: 'Follow-up care',
      });

    expect(res.status).to.equal(401);
  });

  it('lets patients request appointments for their own account', async function () {
    this.timeout(10000);

    const res = await request(app)
      .post('/api/appointments/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        patientId: 'spoofed-patient',
        doctorId: doctor.id,
        appointmentDate: '2026-06-10',
        startTime: '09:00',
        endTime: '10:00',
        reason: 'Follow-up care',
        notes: 'Patient appointment request',
      });

    expect(res.status).to.equal(201);
    expect(res.body.data).to.include({
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentDate: '2026-06-10',
      startTime: '09:00',
      endTime: '10:00',
      status: 'scheduled',
      reason: 'Follow-up care',
    });
  });

  it('rejects non-patient appointment requests', async function () {
    this.timeout(10000);

    const res = await request(app)
      .post('/api/appointments/request')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        doctorId: doctor.id,
        appointmentDate: '2026-06-10',
        startTime: '09:00',
        endTime: '10:00',
        reason: 'Provider should not use patient request route',
      });

    expect(res.status).to.equal(403);
  });
});
