import request from 'supertest';
import { createApp } from '../src/app';

describe('payments', () => {
  it('requires auth for payment status', async () => {
    const app = createApp();
    const res = await request(app).get('/api/payments/booking-id');
    expect(res.status).toBe(401);
  });
});
