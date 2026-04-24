import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { prisma } from '../lib/prisma';
import { uploadBufferToS3 } from '../services/storage';

const router = Router();
router.use(auth);

router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  return res.json(user);
});

router.put('/me', async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { firstName, lastName, phone },
  });
  return res.json(user);
});

router.put('/me/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Avatar required' });
  }
  const avatarUrl = await uploadBufferToS3(req.file.buffer, req.file.mimetype, 'avatars');
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { avatarUrl },
  });
  return res.json(user);
});

router.put('/me/location', async (req, res) => {
  const { locationLat, locationLng, locationAddress } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { locationLat, locationLng, locationAddress },
  });
  return res.json(user);
});

router.put('/me/fcm-token', async (req, res) => {
  const { fcmToken } = req.body;
  const user = await prisma.user.update({ where: { id: req.user!.userId }, data: { fcmToken } });
  return res.json(user);
});

router.delete('/me', async (req, res) => {
  await prisma.user.delete({ where: { id: req.user!.userId } });
  return res.json({ success: true });
});

export default router;
