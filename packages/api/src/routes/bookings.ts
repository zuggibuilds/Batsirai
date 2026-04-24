import { BookingStatus, PaymentStatus } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { sensitiveRouteLogger } from '../middlewares/sensitiveRouteLogger';
import { prisma } from '../lib/prisma';
import { createNotification, notificationService } from '../services/notificationService';
import { computePaymentBreakdown } from '../services/paymentService';
import { socketEmit } from '../socket';

const router = Router();
router.use(auth);

async function pushHistory(bookingId: string, status: BookingStatus, changedBy: string, note?: string) {
  await prisma.bookingStatusHistory.create({
    data: { bookingId, status, changedBy, note },
  });
}

router.post('/', async (req, res) => {
  const booking = await prisma.booking.create({
    data: {
      customerId: req.user!.userId,
      providerId: req.body.providerId,
      serviceId: req.body.serviceId,
      catalogueItemId: req.body.catalogueItemId,
      scheduledAt: new Date(req.body.scheduledAt),
      locationAddress: req.body.locationAddress,
      locationLat: Number(req.body.locationLat),
      locationLng: Number(req.body.locationLng),
      customerNotes: req.body.customerNotes,
      quotedPrice: Number(req.body.quotedPrice),
      status: BookingStatus.PENDING,
    },
  });

  const calc = computePaymentBreakdown(booking.quotedPrice);
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: booking.quotedPrice,
      paymentMethod: 'flutterwave',
      platformCommission: calc.platformCommission,
      providerAmount: calc.providerAmount,
      status: PaymentStatus.PENDING,
    },
  });

  await pushHistory(booking.id, BookingStatus.PENDING, req.user!.userId, 'Booking created');
  return res.status(201).json(booking);
});

router.get('/', async (req, res) => {
  const user = req.user!;
  const bookings = await prisma.booking.findMany({
    where:
      user.role === 'PROVIDER'
        ? { provider: { userId: user.userId } }
        : { customerId: user.userId },
    include: { provider: { include: { user: true } }, customer: true, service: true, payment: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(bookings);
});

router.get('/:id', async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { payment: true, review: true, dispute: true, statusHistory: true },
  });
  return res.json(booking);
});

router.put('/:id/accept', async (req, res) => {
  const booking = await prisma.booking.update({ where: { id: req.params.id }, data: { status: BookingStatus.ACCEPTED } });
  await pushHistory(booking.id, BookingStatus.ACCEPTED, req.user!.userId, 'Accepted by provider');
  await createNotification(booking.customerId, 'BOOKING_ACCEPTED', 'Booking accepted', 'Your booking has been accepted');
  socketEmit.bookingStatusUpdated(booking.id, 'ACCEPTED', 'Provider accepted the booking');
  return res.json(booking);
});

router.put('/:id/reject', async (req, res) => {
  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: BookingStatus.REJECTED, cancellationReason: req.body.reason },
  });
  await pushHistory(booking.id, BookingStatus.REJECTED, req.user!.userId, 'Rejected by provider');
  await createNotification(booking.customerId, 'BOOKING_REJECTED', 'Booking rejected', 'Your booking has been rejected');
  socketEmit.bookingStatusUpdated(booking.id, 'REJECTED', 'Provider rejected the booking');
  return res.json(booking);
});

router.put('/:id/start', async (req, res) => {
  const booking = await prisma.booking.update({ where: { id: req.params.id }, data: { status: BookingStatus.IN_PROGRESS } });
  await pushHistory(booking.id, BookingStatus.IN_PROGRESS, req.user!.userId, 'Provider started job');
  await createNotification(booking.customerId, 'BOOKING_STARTED', 'Job started', 'Provider has started the job');
  socketEmit.bookingStatusUpdated(booking.id, 'IN_PROGRESS', 'Provider started working');
  return res.json(booking);
});

router.put('/:id/complete', sensitiveRouteLogger, async (req, res) => {
  const bookingId = req.params.id;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      provider: { include: { user: true } },
    },
  });

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  if (booking.status === BookingStatus.COMPLETED && booking.payment?.status === PaymentStatus.RELEASED) {
    return res.json({ ...booking, idempotent: true });
  }

  if (!booking.payment || booking.payment.status !== PaymentStatus.IN_ESCROW) {
    return res.status(400).json({ message: 'Payment is not in escrow' });
  }

  if (booking.status !== BookingStatus.IN_PROGRESS && booking.status !== BookingStatus.ACCEPTED) {
    return res.status(400).json({ message: 'Booking is not in completable state' });
  }

  const finalPrice = req.body.finalPrice ? Number(req.body.finalPrice) : booking.quotedPrice;
  const breakdown = computePaymentBreakdown(finalPrice);
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: now,
        finalPrice,
      },
    });

    await tx.payment.update({
      where: { bookingId },
      data: {
        amount: finalPrice,
        platformCommission: breakdown.platformCommission,
        providerAmount: breakdown.providerAmount,
        status: PaymentStatus.RELEASED,
        escrowReleasedAt: now,
      },
    });

    await tx.payout.create({
      data: {
        providerId: booking.providerId,
        amount: breakdown.providerAmount,
        status: 'PENDING',
        method: 'flutterwave',
      },
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status: BookingStatus.COMPLETED,
        note: 'Customer confirmed completion - escrow released',
        changedBy: req.user!.userId,
      },
    });

    return updatedBooking;
  });

  await notificationService.sendJobCompleted(bookingId);
  socketEmit.bookingStatusUpdated(bookingId, 'COMPLETED', 'Job completed and payment released');

  return res.json(result);
});

router.put('/:id/cancel', async (req, res) => {
  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: BookingStatus.CANCELLED, cancelledAt: new Date(), cancellationReason: req.body.reason },
  });
  await pushHistory(booking.id, BookingStatus.CANCELLED, req.user!.userId, 'Cancelled');
  socketEmit.bookingStatusUpdated(booking.id, 'CANCELLED', 'Booking was cancelled');
  return res.json(booking);
});

router.post('/:id/dispute', async (req, res) => {
  const booking = await prisma.booking.update({ where: { id: req.params.id }, data: { status: BookingStatus.DISPUTED } });
  const dispute = await prisma.dispute.create({
    data: {
      bookingId: booking.id,
      raisedBy: req.user!.userId,
      reason: req.body.reason,
      description: req.body.description,
      evidenceUrls: req.body.evidenceUrls ?? [],
    },
  });
  await pushHistory(booking.id, BookingStatus.DISPUTED, req.user!.userId, 'Dispute raised');
  socketEmit.bookingStatusUpdated(booking.id, 'DISPUTED', 'A dispute was raised for this booking');
  return res.status(201).json(dispute);
});

export default router;
