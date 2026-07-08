import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/index.js';

describe('Auth route compatibility', () => {
  it('rewrites legacy health-prefixed auth login requests to the auth handler', async () => {
    const res = await request(app).post('/api/health/auth/login').send({});

    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ message: 'Missing credentials' });
  });
});
