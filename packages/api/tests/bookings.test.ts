import request from 'supertest';
import { createApp } from '../src/app';

describe('bookings', () => {
  it('requires auth for bookings list', async () => {
    const app = createApp();
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
  });
});
