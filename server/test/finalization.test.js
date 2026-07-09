import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/index.js';
import { ensureDatabaseSchema, pool } from '../src/db.js';
import { createUser, signToken } from '../src/auth.js';
import { createPatient } from '../src/patients.js';
import { createAppointment } from '../src/appointments.js';

describe('Finalization security and workflow', () => {
  let admin;
  let doctor;
  let patient;
  let otherPatient;
  let adminToken;
  let doctorToken;
  let patientToken;
  let otherPatientToken;
  let requestedAppointment;

  before(async function () {
    this.timeout(15000);
    const suffix = Date.now();

    await ensureDatabaseSchema();

    admin = await createUser({
      id: `final-admin-${suffix}`,
      name: 'Final Admin',
      email: `final.admin.${suffix}@example.com`,
      password: 'password123',
      role: 'admin',
    });
    doctor = await createUser({
      id: `final-doctor-${suffix}`,
      name: 'Final Doctor',
      email: `final.doctor.${suffix}@example.com`,
      password: 'password123',
      role: 'doctor',
    });
    patient = await createUser({
      id: `final-patient-${suffix}`,
      name: 'Final Patient',
      email: `final.patient.${suffix}@example.com`,
      password: 'password123',
      role: 'patient',
    });
    otherPatient = await createUser({
      id: `final-other-${suffix}`,
      name: 'Other Patient',
      email: `final.other.${suffix}@example.com`,
      password: 'password123',
      role: 'patient',
    });

    for (const user of [patient, otherPatient]) {
      await createPatient({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: '+1 555 010 4444',
        dateOfBirth: '1991-01-01',
        gender: 'other',
        address: '400 Finalization Way',
        medicalHistory: [],
      });
    }

    requestedAppointment = await createAppointment({
      id: `final-request-${suffix}`,
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentDate: '2026-07-15',
      startTime: '09:00',
      endTime: '10:00',
      status: 'requested',
      reason: 'Finalization request',
    });

    adminToken = signToken(admin);
    doctorToken = signToken(doctor);
    patientToken = signToken(patient);
    otherPatientToken = signToken(otherPatient);
  });

  after(async function () {
    this.timeout(10000);
    const userIds = [admin?.id, doctor?.id, patient?.id, otherPatient?.id].filter(Boolean);
    if (userIds.length === 0) return;

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ANY($1::text[])', [userIds]);
    await pool.query('DELETE FROM appointments WHERE patient_id = ANY($1::text[]) OR doctor_id = ANY($1::text[])', [userIds]);
    await pool.query('DELETE FROM audit_logs WHERE actor_id = ANY($1::text[])', [userIds]);
    await pool.query('DELETE FROM patients WHERE id = ANY($1::text[])', [userIds]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::text[])', [userIds]);
  });

  it('prevents patients from listing all patients', async function () {
    const res = await request(app).get('/api/patients').set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).to.equal(403);
  });

  it('prevents patients from reading another patient detail', async function () {
    const res = await request(app).get(`/api/patients/${otherPatient.id}`).set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).to.equal(403);
  });

  it('lets admins read system status', async function () {
    const res = await request(app).get('/api/system/status').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.include({ api: 'online' });
  });

  it('lets care teams approve requested appointments', async function () {
    const res = await request(app)
      .put(`/api/appointments/${requestedAppointment.id}/approve`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).to.equal(200);
    expect(res.body.data).to.include({
      id: requestedAppointment.id,
      status: 'scheduled',
    });
  });

  it('lets users change password with their current password', async function () {
    this.timeout(10000);

    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${otherPatientToken}`)
      .send({
        currentPassword: 'password123',
        newPassword: 'new-password-123',
      });

    expect(changeRes.status).to.equal(200);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: otherPatient.email,
      password: 'new-password-123',
    });

    expect(loginRes.status).to.equal(200);
  });
});
