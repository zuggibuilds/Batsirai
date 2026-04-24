import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(auth);

router.post('/', async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.body.bookingId } });
  if (!booking || booking.status !== 'COMPLETED') {
    return res.status(400).json({ message: 'Review allowed only after completion' });
  }

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      customerId: req.user!.userId,
      providerId: booking.providerId,
      rating: Number(req.body.rating),
      comment: req.body.comment,
    },
  });

  return res.status(201).json(review);
});

router.get('/provider/:id', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { providerId: req.params.id, isPublic: true },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(reviews);
});

router.get('/me', async (req, res) => {
  const reviews = await prisma.review.findMany({ where: { customerId: req.user!.userId } });
  return res.json(reviews);
});

export default router;
