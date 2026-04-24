import { PaymentStatus } from '@prisma/client';
import { Router } from 'express';
import { auth, requireRole } from '../middlewares/auth';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { notificationService } from '../services/notificationService';
import { socketEmit } from '../socket';

const router = Router();

router.post('/initiate', auth, async (req, res) => {
  const { bookingId } = req.body as { bookingId: string };
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  const paymentLink = `https://checkout.flutterwave.com/v3/hosted/pay/${payment.id}`;
  await prisma.payment.update({ where: { bookingId }, data: { flutterwaveRef: `FLW-${Date.now()}` } });
  return res.json({ payment_link: paymentLink });
});

export async function paymentsWebhookHandler(req: any, res: any) {
  try {
    const payload = typeof req.body === 'string' || Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : req.body;

    if (payload.event !== 'charge.completed') {
      res.status(200).json({ received: true });
      return;
    }

    if (payload.data?.status !== 'successful') {
      res.status(200).json({ received: true });
      return;
    }

    const flutterwaveTxId = String(payload.data.id);
    const flutterwaveRef = payload.data.tx_ref as string;

    const eventTimestamp = payload.data?.created_at || payload.created_at;
    if (eventTimestamp) {
      const eventMillis = Date.parse(String(eventTimestamp));
      if (!Number.isNaN(eventMillis)) {
        const ageMs = Date.now() - eventMillis;
        const toleranceMs = 24 * 60 * 60 * 1000;
        if (Math.abs(ageMs) > toleranceMs) {
          res.status(200).json({ received: true, stale: true });
          return;
        }
      }
    }

    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${flutterwaveTxId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      },
    );

    if (!verifyResponse.ok) {
      res.status(200).json({ received: true });
      return;
    }

    const verifyData = await verifyResponse.json() as any;
    if (verifyData?.data?.status !== 'successful') {
      res.status(200).json({ received: true });
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: { flutterwaveRef },
      include: { booking: true },
    });

    if (!payment) {
      res.status(200).json({ received: true });
      return;
    }

    const replayKey = `webhook:flutterwave:tx:${flutterwaveTxId}`;
    const replayClaim = await redis.set(replayKey, '1', 'EX', 24 * 60 * 60, 'NX');
    if (replayClaim !== 'OK') {
      res.status(200).json({ received: true, replay: true });
      return;
    }

    if (
      (payment.status === PaymentStatus.IN_ESCROW || payment.status === PaymentStatus.RELEASED)
      && payment.flutterwaveTxId === flutterwaveTxId
    ) {
      res.status(200).json({ received: true, idempotent: true });
      return;
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const paymentUpdate = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.IN_ESCROW,
          flutterwaveTxId,
        },
      });

      if (paymentUpdate.count === 0) {
        return { movedToEscrow: false };
      }

      const bookingUpdate = await tx.booking.updateMany({
        where: { id: payment.bookingId, status: 'PENDING' },
        data: { status: 'ACCEPTED' },
      });

      if (bookingUpdate.count > 0) {
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: payment.bookingId,
            status: 'ACCEPTED',
            note: 'Payment confirmed - funds in escrow',
            changedBy: 'system',
          },
        });
      }

      return { movedToEscrow: true };
    });

    if (txResult.movedToEscrow) {
      await notificationService.sendBookingPaid(payment.bookingId);
      socketEmit.paymentConfirmed(payment.bookingId, payment.amount);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

router.get('/:bookingId', auth, async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { bookingId: req.params.bookingId } });
  return res.json(payment);
});

router.post('/:bookingId/refund', auth, requireRole(['ADMIN']), async (req, res) => {
  const payment = await prisma.payment.update({
    where: { bookingId: req.params.bookingId },
    data: {
      status: PaymentStatus.REFUNDED,
      refundedAt: new Date(),
      refundReason: req.body.reason ?? 'Admin refund',
    },
  });
  return res.json(payment);
});

export default router;
