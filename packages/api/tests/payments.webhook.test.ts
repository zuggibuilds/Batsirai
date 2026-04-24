const { paymentsWebhookHandler } = require('../src/routes/payments');

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    payment: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../src/lib/redis', () => ({
  redis: {
    set: jest.fn(),
  },
}));

jest.mock('../src/services/notificationService', () => ({
  notificationService: {
    sendBookingPaid: jest.fn(),
  },
}));

jest.mock('../src/socket', () => ({
  socketEmit: {
    paymentConfirmed: jest.fn(),
  },
}));

const { prisma } = require('../src/lib/prisma');
const { redis } = require('../src/lib/redis');
const { notificationService } = require('../src/services/notificationService');
const { socketEmit } = require('../src/socket');

function mockReq(body: any) {
  return { body };
}

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('paymentsWebhookHandler replay and stale guards', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  it('returns stale for old events and skips network/db side effects', async () => {
    const req = mockReq({
      event: 'charge.completed',
      created_at: '2023-01-01T00:00:00.000Z',
      data: {
        id: 'tx_1',
        tx_ref: 'FLW-1',
        status: 'successful',
      },
    });
    const res = mockRes();

    await paymentsWebhookHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true, stale: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.payment.findFirst).not.toHaveBeenCalled();
  });

  it('returns replay for duplicate transaction key and skips escrow transition', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { status: 'successful' } }),
    });

    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment_1',
      bookingId: 'booking_1',
      amount: 150,
      status: 'PENDING',
      flutterwaveTxId: null,
      booking: { status: 'PENDING' },
    });

    redis.set.mockResolvedValue(null);

    const req = mockReq({
      event: 'charge.completed',
      created_at: new Date().toISOString(),
      data: {
        id: 'tx_2',
        tx_ref: 'FLW-2',
        status: 'successful',
      },
    });
    const res = mockRes();

    await paymentsWebhookHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true, replay: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(notificationService.sendBookingPaid).not.toHaveBeenCalled();
    expect(socketEmit.paymentConfirmed).not.toHaveBeenCalled();
  });
});
