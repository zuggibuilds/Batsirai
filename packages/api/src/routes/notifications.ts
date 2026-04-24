import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { sentAt: 'desc' },
  });
  return res.json(notifications);
});

router.put('/:id/read', async (req, res) => {
  const notification = await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  return res.json(notification);
});

router.put('/read-all', async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.userId }, data: { isRead: true } });
  return res.json({ success: true });
});

export default router;
