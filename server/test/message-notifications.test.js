import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/index.js';
import { ensureDatabaseSchema, pool } from '../src/db.js';
import { createUser, signToken } from '../src/auth.js';

describe('Message notification endpoints', () => {
  let doctor;
  let patient;
  let doctorToken;
  let patientToken;

  before(async function () {
    this.timeout(10000);
    const suffix = Date.now();

    await ensureDatabaseSchema();

    doctor = await createUser({
      id: `notify-doctor-${suffix}`,
      name: 'Notify Doctor',
      email: `notify.doctor.${suffix}@example.com`,
      password: 'password123',
      role: 'doctor',
    });
    patient = await createUser({
      id: `notify-patient-${suffix}`,
      name: 'Notify Patient',
      email: `notify.patient.${suffix}@example.com`,
      password: 'password123',
      role: 'patient',
    });

    doctorToken = signToken(doctor);
    patientToken = signToken(patient);
  });

  after(async function () {
    this.timeout(5000);
    if (!doctor || !patient) return;

    await pool.query('DELETE FROM messages WHERE sender_id IN ($1, $2) OR recipient_id IN ($1, $2)', [doctor.id, patient.id]);
    await pool.query('DELETE FROM audit_logs WHERE actor_id IN ($1, $2)', [doctor.id, patient.id]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [doctor.id, patient.id]);
  });

  it('lists unread messages and marks them read when the thread opens', async function () {
    this.timeout(10000);

    const sendRes = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        recipientId: patient.id,
        subject: 'Visit update',
        body: 'Your appointment details have changed.',
      });

    expect(sendRes.status).to.equal(201);

    const unreadRes = await request(app)
      .get('/api/messages/unread')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(unreadRes.status).to.equal(200);
    expect(unreadRes.body.data).to.have.lengthOf(1);
    expect(unreadRes.body.data[0]).to.include({
      id: sendRes.body.data.id,
      senderId: doctor.id,
      recipientId: patient.id,
      subject: 'Visit update',
    });

    const threadRes = await request(app)
      .get(`/api/messages/thread/${doctor.id}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(threadRes.status).to.equal(200);
    expect(threadRes.body.data.some((message) => message.id === sendRes.body.data.id && message.readAt)).to.equal(true);

    const readRes = await request(app)
      .get('/api/messages/unread')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(readRes.status).to.equal(200);
    expect(readRes.body.data).to.have.lengthOf(0);
  });
});
