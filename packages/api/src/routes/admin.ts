import bcrypt from 'bcryptjs';
import { AdminRole, CatalogueStatus, ImageReviewStatus, PaymentStatus, UserRole, UserStatus, VerificationStatus } from '@prisma/client';
import { Router } from 'express';
import qrcode from 'qrcode';
import speakeasy from 'speakeasy';
import { adminAuth, checkAdminRole } from '../middlewares/adminAuth';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { notificationService } from '../services/notificationService';
import { clearFailedAttempts, getLockoutRemainingSeconds, registerFailedAttempt, trackFailedAttempt, getSecurityAlertSnapshot } from '../services/securityAlerts';
import { subscriptionService } from '../services/subscriptionService';
import { signAdminToken } from '../utils/jwt';

const router = Router();

async function writeAudit(adminId: string, action: string, entity: string, entityId: string | null, details: any, ipAddress: string | undefined) {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      entity,
      entityId: entityId ?? undefined,
      details,
      ipAddress,
    },
  });
}

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const clientIp = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    || req.ip
    || req.socket.remoteAddress
    || 'unknown';
  const lockIdentifier = `${email ?? 'unknown'}|${String(clientIp).replace('::ffff:', '')}`;

  const lockoutTtl = await getLockoutRemainingSeconds('admin-login', lockIdentifier);
  if (lockoutTtl > 0) {
    const adminForAudit = await prisma.adminUser.findUnique({ where: { email } });
    if (adminForAudit) {
      await writeAudit(
        adminForAudit.id,
        'ADMIN_LOGIN_LOCKOUT_HIT',
        'AdminUser',
        adminForAudit.id,
        { retryAfterSec: lockoutTtl },
        req.ip,
      );
    }
    return res.status(429).json({
      message: 'Too many failed admin login attempts. Try again later.',
      retryAfterSec: lockoutTtl,
    });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin || !admin.isActive || !(await bcrypt.compare(password, admin.passwordHash))) {
    const failed = await registerFailedAttempt({
      scope: 'admin-login',
      identifier: lockIdentifier,
      reason: 'invalid_credentials',
      threshold: Number(process.env.ADMIN_LOGIN_LOCK_THRESHOLD ?? 5),
      windowSec: Number(process.env.ADMIN_LOGIN_LOCK_WINDOW_SEC ?? 15 * 60),
      lockoutSec: Number(process.env.ADMIN_LOGIN_LOCKOUT_SEC ?? 15 * 60),
      metadata: { email },
    });
    if (failed.locked && admin) {
      await writeAudit(
        admin.id,
        'ADMIN_LOGIN_LOCKOUT_TRIGGERED',
        'AdminUser',
        admin.id,
        { failedCount: failed.count },
        req.ip,
      );
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  await clearFailedAttempts('admin-login', lockIdentifier);

  const ephemeralToken = `tmp_${Math.random().toString(36).slice(2)}`;
  await redis.set(`admin:ephemeral:${ephemeralToken}`, admin.id, 'EX', 5 * 60);

  return res.json({
    ephemeralToken,
    requiresTotpSetup: !admin.totpEnabled,
  });
});

router.post('/auth/setup-totp', async (req, res) => {
  const { ephemeralToken, code } = req.body as { ephemeralToken: string; code?: string };
  const adminId = await redis.get(`admin:ephemeral:${ephemeralToken}`);
  if (!adminId) {
    return res.status(401).json({ message: 'Invalid or expired ephemeral token' });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  let secret = admin.totpSecret;
  if (!secret) {
    const generated = speakeasy.generateSecret({ name: `Batsirai (${admin.email})` });
    secret = generated.base32;
    await prisma.adminUser.update({ where: { id: admin.id }, data: { totpSecret: secret } });
  }

  if (!code) {
    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: admin.email,
      issuer: 'Batsirai',
      encoding: 'base32',
    });
    const qrCode = await qrcode.toDataURL(otpauthUrl);
    return res.json({ otpauthUrl, qrCode });
  }

  const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 });
  if (!ok) {
    await trackFailedAttempt({
      scope: 'admin-totp-setup',
      identifier: admin.id,
      reason: 'invalid_totp_code',
      metadata: { email: admin.email },
    });
    return res.status(400).json({ message: 'Invalid TOTP code' });
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { totpEnabled: true } });
  return res.json({ success: true });
});

router.post('/auth/verify-totp', async (req, res) => {
  const { ephemeralToken, code } = req.body as { ephemeralToken: string; code: string };
  const adminId = await redis.get(`admin:ephemeral:${ephemeralToken}`);
  if (!adminId) {
    return res.status(401).json({ message: 'Invalid or expired ephemeral token' });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin || !admin.totpEnabled || !admin.totpSecret) {
    return res.status(403).json({ message: 'TOTP setup required', requiresTotpSetup: true });
  }

  const ok = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!ok) {
    await trackFailedAttempt({
      scope: 'admin-totp-verify',
      identifier: admin.id,
      reason: 'invalid_totp_code',
      metadata: { email: admin.email },
    });
    return res.status(401).json({ message: 'Invalid TOTP code' });
  }

  const token = signAdminToken({ adminId: admin.id, email: admin.email, role: admin.role });
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date(), lastLoginIp: req.ip } });
  await redis.del(`admin:ephemeral:${ephemeralToken}`);
  await writeAudit(admin.id, 'ADMIN_LOGIN_SUCCESS', 'AdminUser', admin.id, { role: admin.role }, req.ip);

  return res.json({
    token,
    role: admin.role,
    lastLoginAt: admin.lastLoginAt,
    lastLoginIp: admin.lastLoginIp,
    sessionExpiresIn: '8h',
  });
});

router.get('/auth/me', adminAuth, async (req, res) => {
  const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.adminId } });
  return res.json(admin);
});

router.get('/dashboard/stats', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'CATALOGUE_REVIEWER', 'FINANCE_ADMIN', 'SUPPORT']), async (_req, res) => {
  const [users, providers, bookings, pendingCatalogue, disputesOpen] = await Promise.all([
    prisma.user.count(),
    prisma.provider.count(),
    prisma.booking.count(),
    prisma.catalogueItem.count({ where: { status: CatalogueStatus.PENDING_REVIEW } }),
    prisma.dispute.count({ where: { status: 'OPEN' } }),
  ]);

  return res.json({ users, providers, bookings, pendingCatalogue, disputesOpen });
});

router.get('/dashboard/bookings-chart', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'FINANCE_ADMIN']), async (_req, res) => {
  const rows = await prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
    SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, count(*) AS count
    FROM "Booking"
    WHERE "createdAt" >= now() - interval '30 days'
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  return res.json(rows.map((r) => ({ day: r.day, count: Number(r.count) })));
});

router.get('/dashboard/categories-chart', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'CATALOGUE_REVIEWER', 'FINANCE_ADMIN']), async (_req, res) => {
  const rows = await prisma.$queryRaw<Array<{ category: string; count: bigint }>>`
    SELECT c.name as category, count(b.id) as count
    FROM "Booking" b
    JOIN "Service" s ON s.id = b."serviceId"
    JOIN "Category" c ON c.id = s."categoryId"
    WHERE b."createdAt" >= date_trunc('day', now())
    GROUP BY c.name
    ORDER BY count DESC
    LIMIT 10
  `;
  return res.json(rows.map((r) => ({ category: r.category, count: Number(r.count) })));
});

router.get('/providers', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const status = req.query.status as VerificationStatus | undefined;
  const providers = await prisma.provider.findMany({
    where: status ? { verificationStatus: status } : undefined,
    include: { user: true },
    orderBy: { joinedAt: 'desc' },
  });
  return res.json(providers);
});

router.get('/providers/:id', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const provider = await prisma.provider.findUnique({
    where: { id: req.params.id },
    include: { user: true, catalogueItems: { include: { images: true } } },
  });
  return res.json(provider);
});

router.put('/providers/:id/approve', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const provider = await prisma.provider.update({
    where: { id: req.params.id },
    data: { verificationStatus: VerificationStatus.APPROVED, isVerified: true },
  });
  await subscriptionService.activateSubscription(provider.id);
  await notificationService.sendProviderApproved(provider.id);
  await writeAudit(req.admin!.adminId, 'APPROVE_PROVIDER', 'Provider', provider.id, {}, req.ip);
  return res.json(provider);
});

router.put('/providers/:id/reject', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const provider = await prisma.provider.update({
    where: { id: req.params.id },
    data: {
      verificationStatus: VerificationStatus.REJECTED,
      verificationNotes: req.body.reason,
      isVerified: false,
    },
  });
  await writeAudit(req.admin!.adminId, 'REJECT_PROVIDER', 'Provider', provider.id, { reason: req.body.reason }, req.ip);
  return res.json(provider);
});

router.put('/providers/:id/suspend', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const provider = await prisma.provider.update({ where: { id: req.params.id }, data: { verificationStatus: VerificationStatus.SUSPENDED, isAvailable: false } });
  await writeAudit(req.admin!.adminId, 'SUSPEND_PROVIDER', 'Provider', provider.id, {}, req.ip);
  return res.json(provider);
});

router.put('/providers/:id/unsuspend', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const provider = await prisma.provider.update({ where: { id: req.params.id }, data: { verificationStatus: VerificationStatus.APPROVED, isAvailable: true } });
  await writeAudit(req.admin!.adminId, 'UNSUSPEND_PROVIDER', 'Provider', provider.id, {}, req.ip);
  return res.json(provider);
});

router.put('/providers/:id/ban', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const provider = await prisma.provider.update({ where: { id: req.params.id }, data: { isAvailable: false, isVerified: false } });
  await prisma.user.update({ where: { id: provider.userId }, data: { status: UserStatus.BANNED } });
  await writeAudit(req.admin!.adminId, 'BAN_PROVIDER', 'Provider', provider.id, {}, req.ip);
  return res.json(provider);
});

router.get('/customers', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'SUPPORT']), async (_req, res) => {
  const customers = await prisma.user.findMany({ where: { role: UserRole.CUSTOMER }, orderBy: { createdAt: 'desc' } });
  return res.json(customers);
});

router.get('/customers/:id', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'SUPPORT']), async (req, res) => {
  const customer = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { bookingsAsCustomer: true, reviews: true },
  });
  return res.json(customer);
});

router.put('/customers/:id/suspend', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const customer = await prisma.user.update({ where: { id: req.params.id }, data: { status: UserStatus.SUSPENDED } });
  await writeAudit(req.admin!.adminId, 'SUSPEND_CUSTOMER', 'User', customer.id, {}, req.ip);
  return res.json(customer);
});

router.put('/customers/:id/unsuspend', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const customer = await prisma.user.update({ where: { id: req.params.id }, data: { status: UserStatus.ACTIVE } });
  await writeAudit(req.admin!.adminId, 'UNSUSPEND_CUSTOMER', 'User', customer.id, {}, req.ip);
  return res.json(customer);
});

router.get('/catalogue/queue', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'CATALOGUE_REVIEWER']), async (_req, res) => {
  const queue = await prisma.catalogueItem.findMany({
    where: {
      OR: [
        { status: CatalogueStatus.PENDING_REVIEW },
        { images: { some: { reviewStatus: ImageReviewStatus.PENDING } } },
      ],
    },
    include: { images: true, provider: { include: { user: true } }, service: true },
  });
  return res.json(queue);
});

router.get('/catalogue/:itemId', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'CATALOGUE_REVIEWER']), async (req, res) => {
  const item = await prisma.catalogueItem.findUnique({
    where: { id: req.params.itemId },
    include: { images: true, provider: { include: { user: true } }, service: true },
  });
  return res.json(item);
});

router.put('/catalogue/:itemId/approve', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'CATALOGUE_REVIEWER']), async (req, res) => {
  const item = await prisma.catalogueItem.update({ where: { id: req.params.itemId }, data: { status: CatalogueStatus.APPROVED, isActive: true } });
  await writeAudit(req.admin!.adminId, 'APPROVE_CATALOGUE', 'CatalogueItem', item.id, {}, req.ip);
  return res.json(item);
});

router.put('/catalogue/:itemId/reject', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'CATALOGUE_REVIEWER']), async (req, res) => {
  const item = await prisma.catalogueItem.update({
    where: { id: req.params.itemId },
    data: { status: CatalogueStatus.REJECTED, rejectionReason: req.body.reason, isActive: false },
  });
  await writeAudit(req.admin!.adminId, 'REJECT_CATALOGUE', 'CatalogueItem', item.id, { reason: req.body.reason }, req.ip);
  return res.json(item);
});

router.put('/catalogue/:itemId/images/:imageId/approve', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'CATALOGUE_REVIEWER']), async (req, res) => {
  const image = await prisma.catalogueImage.update({ where: { id: req.params.imageId }, data: { reviewStatus: ImageReviewStatus.APPROVED, rejectionReason: null } });
  await writeAudit(req.admin!.adminId, 'APPROVE_IMAGE', 'CatalogueImage', image.id, {}, req.ip);
  return res.json(image);
});

router.put('/catalogue/:itemId/images/:imageId/reject', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'CATALOGUE_REVIEWER']), async (req, res) => {
  const image = await prisma.catalogueImage.update({
    where: { id: req.params.imageId },
    data: { reviewStatus: ImageReviewStatus.REJECTED, rejectionReason: req.body.reason },
  });
  await writeAudit(req.admin!.adminId, 'REJECT_IMAGE', 'CatalogueImage', image.id, { reason: req.body.reason }, req.ip);
  return res.json(image);
});

router.get('/bookings', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'SUPPORT']), async (req, res) => {
  const status = req.query.status as any;
  const bookings = await prisma.booking.findMany({
    where: status ? { status } : undefined,
    include: { customer: true, provider: { include: { user: true } }, payment: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(bookings);
});

router.get('/bookings/:id', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'SUPPORT']), async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { customer: true, provider: { include: { user: true } }, payment: true, dispute: true, review: true },
  });
  return res.json(booking);
});

router.get('/disputes', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'SUPPORT', 'FINANCE_ADMIN']), async (req, res) => {
  const status = req.query.status as any;
  const disputes = await prisma.dispute.findMany({
    where: status ? { status } : undefined,
    include: { booking: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(disputes);
});

router.get('/disputes/:id', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'SUPPORT', 'FINANCE_ADMIN']), async (req, res) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: req.params.id },
    include: { booking: { include: { payment: true, customer: true, provider: { include: { user: true } } } } },
  });
  return res.json(dispute);
});

router.put('/disputes/:id/release-payment', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'FINANCE_ADMIN']), async (req, res) => {
  const dispute = await prisma.dispute.findUnique({ where: { id: req.params.id } });
  if (!dispute) {
    return res.status(404).json({ message: 'Dispute not found' });
  }

  const payment = await prisma.payment.update({
    where: { bookingId: dispute.bookingId },
    data: { status: PaymentStatus.RELEASED, escrowReleasedAt: new Date() },
  });

  await prisma.dispute.update({
    where: { id: dispute.id },
    data: { status: 'RESOLVED_PROVIDER', resolvedBy: req.admin!.adminId, resolvedAt: new Date(), resolution: 'Escrow released to provider' },
  });

  await writeAudit(req.admin!.adminId, 'RELEASE_ESCROW', 'Dispute', dispute.id, {}, req.ip);
  return res.json(payment);
});

router.put('/disputes/:id/refund-customer', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'FINANCE_ADMIN']), async (req, res) => {
  const dispute = await prisma.dispute.findUnique({ where: { id: req.params.id } });
  if (!dispute) {
    return res.status(404).json({ message: 'Dispute not found' });
  }

  const payment = await prisma.payment.update({
    where: { bookingId: dispute.bookingId },
    data: { status: PaymentStatus.REFUNDED, refundedAt: new Date(), refundReason: 'Dispute resolution refund' },
  });

  await prisma.dispute.update({
    where: { id: dispute.id },
    data: { status: 'RESOLVED_CUSTOMER', resolvedBy: req.admin!.adminId, resolvedAt: new Date(), resolution: 'Refunded customer' },
  });

  await writeAudit(req.admin!.adminId, 'REFUND_CUSTOMER', 'Dispute', dispute.id, {}, req.ip);
  return res.json(payment);
});

router.put('/disputes/:id/close', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER', 'SUPPORT']), async (req, res) => {
  const dispute = await prisma.dispute.update({ where: { id: req.params.id }, data: { status: 'CLOSED', resolvedBy: req.admin!.adminId, resolvedAt: new Date(), resolution: req.body.resolution ?? 'Closed by admin' } });
  await writeAudit(req.admin!.adminId, 'CLOSE_DISPUTE', 'Dispute', dispute.id, { resolution: req.body.resolution }, req.ip);
  return res.json(dispute);
});

router.get('/payments', adminAuth, checkAdminRole(['SUPER_ADMIN', 'FINANCE_ADMIN']), async (_req, res) => {
  const payments = await prisma.payment.findMany({ include: { booking: true }, orderBy: { createdAt: 'desc' } });
  return res.json(payments);
});

router.get('/payments/escrow', adminAuth, checkAdminRole(['SUPER_ADMIN', 'FINANCE_ADMIN']), async (_req, res) => {
  const payments = await prisma.payment.findMany({ where: { status: PaymentStatus.IN_ESCROW } });
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  return res.json({ total, count: payments.length, payments });
});

router.post('/payments/payout', adminAuth, checkAdminRole(['SUPER_ADMIN', 'FINANCE_ADMIN']), async (req, res) => {
  const payout = await prisma.payout.create({
    data: {
      providerId: req.body.providerId,
      amount: Number(req.body.amount),
      method: req.body.method ?? 'bank_transfer',
      status: 'PROCESSING',
      reference: `PO-${Date.now()}`,
    },
  });

  await writeAudit(req.admin!.adminId, 'CREATE_PAYOUT', 'Payout', payout.id, { amount: payout.amount }, req.ip);
  return res.status(201).json(payout);
});

router.get('/payments/reports', adminAuth, checkAdminRole(['SUPER_ADMIN', 'FINANCE_ADMIN']), async (_req, res) => {
  const payments = await prisma.payment.findMany();
  const totals = payments.reduce(
    (acc, p) => {
      acc.gross += p.amount;
      acc.commission += p.platformCommission;
      acc.providerNet += p.providerAmount;
      return acc;
    },
    { gross: 0, commission: 0, providerNet: 0 },
  );

  return res.json({ totals, count: payments.length });
});

router.get('/admins', adminAuth, checkAdminRole(['SUPER_ADMIN']), async (_req, res) => {
  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(admins);
});

router.post('/admins', adminAuth, checkAdminRole(['SUPER_ADMIN']), async (req, res) => {
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const admin = await prisma.adminUser.create({
    data: {
      email: req.body.email,
      passwordHash,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role as AdminRole,
      isActive: true,
    },
  });
  await writeAudit(req.admin!.adminId, 'CREATE_ADMIN', 'AdminUser', admin.id, { role: admin.role }, req.ip);
  return res.status(201).json(admin);
});

router.put('/admins/:id', adminAuth, checkAdminRole(['SUPER_ADMIN']), async (req, res) => {
  const admin = await prisma.adminUser.update({
    where: { id: req.params.id },
    data: { role: req.body.role as AdminRole, isActive: req.body.isActive },
  });
  await writeAudit(req.admin!.adminId, 'UPDATE_ADMIN', 'AdminUser', admin.id, {}, req.ip);
  return res.json(admin);
});

router.delete('/admins/:id', adminAuth, checkAdminRole(['SUPER_ADMIN']), async (req, res) => {
  await prisma.adminUser.delete({ where: { id: req.params.id } });
  await writeAudit(req.admin!.adminId, 'DELETE_ADMIN', 'AdminUser', req.params.id, {}, req.ip);
  return res.json({ success: true });
});

router.get('/audit-log', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (_req, res) => {
  const logs = await prisma.auditLog.findMany({
    include: { admin: true },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });
  return res.json(logs);
});

router.get('/settings', adminAuth, checkAdminRole(['SUPER_ADMIN']), async (_req, res) => {
  const settings = {
    PLATFORM_COMMISSION_RATE: process.env.PLATFORM_COMMISSION_RATE,
    PROVIDER_SUBSCRIPTION_FEE: process.env.PROVIDER_SUBSCRIPTION_FEE,
    PAYOUT_SCHEDULE_DAYS: process.env.PAYOUT_SCHEDULE_DAYS,
    MIN_CATALOGUE_IMAGES: process.env.MIN_CATALOGUE_IMAGES,
  };
  return res.json(settings);
});

router.get('/security/alerts', adminAuth, checkAdminRole(['SUPER_ADMIN', 'OPS_MANAGER']), async (req, res) => {
  const rawPage = Number(req.query.page ?? 1);
  const rawLimit = Number(req.query.limit ?? 100);

  if (!Number.isInteger(rawPage) || rawPage < 1) {
    return res.status(400).json({ message: 'page must be a positive integer' });
  }

  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 200) {
    return res.status(400).json({ message: 'limit must be an integer between 1 and 200' });
  }

  const snapshot = await getSecurityAlertSnapshot({ page: rawPage, limit: rawLimit });
  return res.json(snapshot);
});

router.put('/settings', adminAuth, checkAdminRole(['SUPER_ADMIN']), async (req, res) => {
  await writeAudit(req.admin!.adminId, 'UPDATE_SETTINGS', 'Settings', null, req.body, req.ip);
  return res.json({ success: true, settings: req.body });
});

export default router;
