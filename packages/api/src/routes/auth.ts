import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { auth } from '../middlewares/auth';
import { clearFailedAttempts, getLockoutRemainingSeconds, registerFailedAttempt } from '../services/securityAlerts';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, phone, password, firstName, lastName, role } = req.body as {
    email: string;
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  };

  if (!email || !phone || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        firstName,
        lastName,
        role: role ?? UserRole.CUSTOMER,
      },
    });

    if (user.role === UserRole.PROVIDER) {
      await prisma.provider.create({
        data: {
          userId: user.id,
          businessName: `${firstName} ${lastName}`,
        },
      });
    }

    return res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'field';
      return res.status(409).json({ message: `An account with this ${target} already exists.` });
    }

    throw error;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const clientIp = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    || req.ip
    || req.socket.remoteAddress
    || 'unknown';
  const lockIdentifier = `${email ?? 'unknown'}|${String(clientIp).replace('::ffff:', '')}`;

  const lockoutTtl = await getLockoutRemainingSeconds('user-login', lockIdentifier);
  if (lockoutTtl > 0) {
    return res.status(429).json({
      message: 'Too many failed login attempts. Please try again later.',
      retryAfterSec: lockoutTtl,
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const failed = await registerFailedAttempt({
      scope: 'user-login',
      identifier: lockIdentifier,
      reason: 'invalid_credentials',
      threshold: Number(process.env.LOGIN_LOCK_THRESHOLD ?? 5),
      windowSec: Number(process.env.LOGIN_LOCK_WINDOW_SEC ?? 15 * 60),
      lockoutSec: Number(process.env.LOGIN_LOCKOUT_SEC ?? 15 * 60),
      metadata: { email },
    });
    if (failed.locked) {
      console.warn('[SecurityAlert]', JSON.stringify({
        scope: 'user-login',
        identifier: lockIdentifier,
        reason: 'lockout_triggered',
        count: failed.count,
        timestamp: new Date().toISOString(),
      }));
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  await clearFailedAttempts('user-login', lockIdentifier);

  const payload = { userId: user.id, email: user.email, role: user.role } as const;
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return res.json({ accessToken, refreshToken });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };

  const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: true } });
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const payload = {
    userId: tokenRecord.user.id,
    email: tokenRecord.user.email,
    role: tokenRecord.user.role,
  } as const;

  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: tokenRecord.user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return res.json({ accessToken, refreshToken: newRefreshToken });
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  return res.json({ success: true });
});

router.post('/verify-email', async (req, res) => {
  const { email } = req.body as { email: string };
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });
  return res.json({ success: true });
});

router.post('/verify-phone', async (req, res) => {
  const { phone } = req.body as { phone: string };
  await prisma.user.update({ where: { phone }, data: { phoneVerified: true } });
  return res.json({ success: true });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = Math.random().toString(36).slice(2);
    await redis.set(`reset:${token}`, user.id, 'EX', 15 * 60);
  }
  return res.json({ success: true });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body as { token: string; password: string };
  const userId = await redis.get(`reset:${token}`);
  if (!userId) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  await redis.del(`reset:${token}`);
  return res.json({ success: true });
});

router.get('/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { provider: true },
  });
  return res.json(user);
});

export default router;
