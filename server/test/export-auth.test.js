import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/index.js';
import { ensureDatabaseSchema } from '../src/db.js';
import { createUser, signToken } from '../src/auth.js';
import { pool } from '../src/db.js';

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

  describe('Authenticated admin access', () => {
    let adminUser;
    let adminToken;

    before(async function () {
      this.timeout(10000);
      // Ensure schema exists
      await ensureDatabaseSchema();
      // create temporary admin user
      adminUser = await createUser({ id: `test-admin-${Date.now()}`, name: 'Test Admin', email: `admin+${Date.now()}@example.com`, password: 'password123', role: 'admin' });
      adminToken = signToken(adminUser);
    });

    after(async function () {
      this.timeout(5000);
      // cleanup user if created
      if (adminUser && adminUser.id) {
        await pool.query('DELETE FROM users WHERE id = $1', [adminUser.id]);
      }
    });

    it('admin can export CSV (export endpoint)', async function () {
      const res = await request(app).get('/api/audit-logs/export?format=csv').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('url');
    });

    it('admin can stream CSV (stream endpoint)', async function () {
      const res = await request(app).get('/api/audit-logs/stream').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/text\/csv/);
    });
  });
});
