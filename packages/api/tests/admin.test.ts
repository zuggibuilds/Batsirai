import request from 'supertest';
import { createApp } from '../src/app';

describe('admin', () => {
  it('protects admin routes', async () => {
    const app = createApp();
    const res = await request(app).get('/api/admin/dashboard/stats');
    expect(res.status).toBe(403);
  });
});
