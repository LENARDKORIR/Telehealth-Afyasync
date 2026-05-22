import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/index.js';

describe('Audit export auth', () => {
  it('GET /api/audit-logs should return 401 without token', async () => {
    const res = await request(app).get('/api/audit-logs');
    expect(res.status).to.equal(401);
  });

  it('GET /api/audit-logs/export should return 401 without token', async () => {
    const res = await request(app).get('/api/audit-logs/export');
    expect(res.status).to.equal(401);
  });

  it('GET /api/audit-logs/stream should return 401 without token', async () => {
    const res = await request(app).get('/api/audit-logs/stream');
    expect(res.status).to.equal(401);
  });

  it('Invalid token returns 401', async () => {
    const res = await request(app).get('/api/audit-logs').set('Authorization', 'Bearer invalid.token');
    expect(res.status).to.equal(401);
  });
});
