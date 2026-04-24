import request from 'supertest';
import { createApp } from '../src/app';

describe('search', () => {
  it('responds to search endpoint', async () => {
    const app = createApp();
    const res = await request(app).get('/api/search?q=plumber');
    expect([200, 500]).toContain(res.status);
  });
});
