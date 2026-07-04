import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/index.js';
import { ensureDatabaseSchema, pool } from '../src/db.js';
import { createUser, signToken } from '../src/auth.js';
import { createPatient } from '../src/patients.js';
import { createAppointment } from '../src/appointments.js';
import { createMedicalRecord } from '../src/medicalRecords.js';

const toDateKey = (date) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

describe('Provider dashboard analytics', () => {
  let doctor;
  let doctorToken;
  let patientIds = [];

  before(async function () {
    this.timeout(10000);
    const suffix = Date.now();
    const today = new Date();
    const yesterday = addDays(today, -1);
    const oldDate = addDays(today, -45);

    await ensureDatabaseSchema();

    doctor = await createUser({
      id: `analytics-doctor-${suffix}`,
      name: 'Analytics Doctor',
      email: `analytics.doctor.${suffix}@example.com`,
      password: 'password123',
      role: 'doctor',
    });
    doctorToken = signToken(doctor);

    const patients = [
      {
        id: `analytics-active-${suffix}`,
        name: 'Analytics Active Patient',
      },
      {
        id: `analytics-noshow-${suffix}`,
        name: 'Analytics No Show Patient',
      },
      {
        id: `analytics-gap-${suffix}`,
        name: 'Analytics Follow Up Gap Patient',
      },
    ];
    patientIds = patients.map((patient) => patient.id);

    for (const patient of patients) {
      await createPatient({
        id: patient.id,
        name: patient.name,
        email: `${patient.id}@example.com`,
        phone: '+1 555 010 3333',
        dateOfBirth: '1988-01-01',
        gender: 'other',
        address: '200 Analytics Way',
        medicalHistory: [],
      });
    }

    await createAppointment({
      id: `analytics-appointment-active-${suffix}`,
      patientId: patients[0].id,
      doctorId: doctor.id,
      appointmentDate: toDateKey(today),
      startTime: '09:00',
      endTime: '10:00',
      status: 'scheduled',
      reason: 'Volume test visit',
    });
    await createAppointment({
      id: `analytics-appointment-noshow-${suffix}`,
      patientId: patients[1].id,
      doctorId: doctor.id,
      appointmentDate: toDateKey(yesterday),
      startTime: '10:00',
      endTime: '11:00',
      status: 'no-show',
      reason: 'No-show test visit',
    });
    await createAppointment({
      id: `analytics-appointment-gap-${suffix}`,
      patientId: patients[2].id,
      doctorId: doctor.id,
      appointmentDate: toDateKey(oldDate),
      startTime: '11:00',
      endTime: '12:00',
      status: 'completed',
      reason: 'Old follow-up visit',
    });
    await createMedicalRecord({
      id: `analytics-record-gap-${suffix}`,
      patientId: patients[2].id,
      doctorId: doctor.id,
      diagnosis: 'Follow-up review',
      symptoms: ['Follow-up'],
      notes: 'Needs follow-up after old visit.',
      recordDate: toDateKey(oldDate),
    });
  });

  after(async function () {
    this.timeout(5000);
    if (!doctor) return;

    await pool.query('DELETE FROM medical_records WHERE doctor_id = $1 OR patient_id = ANY($2::text[])', [doctor.id, patientIds]);
    await pool.query('DELETE FROM appointments WHERE doctor_id = $1 OR patient_id = ANY($2::text[])', [doctor.id, patientIds]);
    await pool.query('DELETE FROM patients WHERE id = ANY($1::text[])', [patientIds]);
    await pool.query('DELETE FROM users WHERE id = $1', [doctor.id]);
  });

  it('returns patient volume, no-show, and follow-up gap metrics', async function () {
    this.timeout(10000);

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.data.patientVolume.activePatients30d).to.be.at.least(2);
    expect(res.body.data.patientVolume.trend).to.have.lengthOf(6);
    expect(res.body.data.noShows.count30d).to.be.at.least(1);
    expect(res.body.data.noShows.rate30d).to.be.at.least(1);
    expect(res.body.data.followUpGaps.count).to.be.at.least(1);
    expect(res.body.data.followUpGaps.patients.some((patient) => patient.patientId === patientIds[2])).to.equal(true);
  });
});
