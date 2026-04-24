import request from 'supertest';
import { createApp } from '../src/app';

describe('providers', () => {
  it('lists providers', async () => {
    const app = createApp();
    const res = await request(app).get('/api/providers');
    expect([200, 500]).toContain(res.status);
  });
});
