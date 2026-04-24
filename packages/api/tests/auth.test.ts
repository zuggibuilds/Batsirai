import request from 'supertest';
import { createApp } from '../src/app';

describe('auth', () => {
  it('has health endpoint', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('rejects unauthenticated me endpoint', async () => {
    const app = createApp();
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
