import { Router } from 'express';
import { CatalogueStatus, ImageReviewStatus, VerificationStatus } from '@prisma/client';
import { auth, requireRole } from '../middlewares/auth';
import { imageUploadRateLimiter } from '../middlewares/rateLimit';
import { upload } from '../middlewares/upload';
import { catalogueUpload, validateAndProcessImages } from '../middlewares/imageValidation';
import { prisma } from '../lib/prisma';
import { searchProviders } from '../services/searchService';
import { uploadBufferToS3 } from '../services/storage';

const router = Router();

function toOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

router.get('/', async (req, res) => {
  const lat = toOptionalNumber(req.query.lat);
  const lng = toOptionalNumber(req.query.lng);
  const radius = toOptionalNumber(req.query.radius);
  const minRating = toOptionalNumber(req.query.minRating);
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;

  if ((req.query.lat !== undefined || req.query.lng !== undefined) && (lat === undefined || lng === undefined)) {
    return res.status(400).json({ message: 'lat and lng must both be valid numbers' });
  }

  if (lat !== undefined && (lat < -90 || lat > 90)) {
    return res.status(400).json({ message: 'lat must be between -90 and 90' });
  }

  if (lng !== undefined && (lng < -180 || lng > 180)) {
    return res.status(400).json({ message: 'lng must be between -180 and 180' });
  }

  if (radius !== undefined && (radius <= 0 || radius > 200)) {
    return res.status(400).json({ message: 'radius must be greater than 0 and less than or equal to 200km' });
  }

  if (minRating !== undefined && (minRating < 0 || minRating > 5)) {
    return res.status(400).json({ message: 'minRating must be between 0 and 5' });
  }

  if (lat !== undefined && lng !== undefined) {
    const providers = await searchProviders({
      lat,
      lng,
      radius: radius ?? 10,
      category,
      minRating: minRating ?? 0,
    });
    return res.json(providers);
  }

  const providers = await prisma.provider.findMany({
    where: {
      isVerified: true,
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiresAt: { gt: new Date() },
      averageRating: { gte: minRating ?? 0 },
    },
    include: { user: true },
    orderBy: { averageRating: 'desc' },
  });

  return res.json(providers);
});

router.get('/:id', async (req, res) => {
  const provider = await prisma.provider.findUnique({
    where: { id: req.params.id },
    include: {
      user: true,
      catalogueItems: { include: { images: true, service: true } },
      reviews: true,
      availability: true,
    },
  });
  return res.json(provider);
});

router.get('/:id/catalogue', async (req, res) => {
  const items = await prisma.catalogueItem.findMany({
    where: { providerId: req.params.id, status: CatalogueStatus.APPROVED, isActive: true },
    include: { images: true, service: true },
  });
  return res.json(items);
});

router.get('/:id/reviews', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { providerId: req.params.id },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(reviews);
});

router.get('/:id/availability', async (req, res) => {
  const availability = await prisma.providerAvailability.findMany({ where: { providerId: req.params.id } });
  return res.json(availability);
});

router.post('/onboard', auth, requireRole(['PROVIDER']), async (req, res) => {
  const provider = await prisma.provider.update({
    where: { userId: req.user!.userId },
    data: {
      ...req.body,
      verificationStatus: VerificationStatus.DOCUMENTS_SUBMITTED,
    },
  });
  return res.json(provider);
});

router.put('/me', auth, requireRole(['PROVIDER']), async (req, res) => {
  const provider = await prisma.provider.update({
    where: { userId: req.user!.userId },
    data: req.body,
  });
  return res.json(provider);
});

router.put('/me/availability', auth, requireRole(['PROVIDER']), async (req, res) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) {
    return res.status(404).json({ message: 'Provider profile not found' });
  }

  await prisma.providerAvailability.deleteMany({ where: { providerId: provider.id } });
  await prisma.providerAvailability.createMany({
    data: (req.body.availability ?? []).map((slot: any) => ({
      providerId: provider.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
    })),
  });

  return res.json({ success: true });
});

router.put('/me/documents', auth, requireRole(['PROVIDER']), upload.fields([{ name: 'idDocument' }, { name: 'certification' }]), async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const idDocument = files?.idDocument?.[0];
  const certification = files?.certification?.[0];

  const provider = await prisma.provider.update({
    where: { userId: req.user!.userId },
    data: {
      idDocumentUrl: idDocument ? await uploadBufferToS3(idDocument.buffer, idDocument.mimetype, 'documents') : undefined,
      certificationUrl: certification ? await uploadBufferToS3(certification.buffer, certification.mimetype, 'documents') : undefined,
      verificationStatus: VerificationStatus.DOCUMENTS_SUBMITTED,
    },
  });

  return res.json(provider);
});

router.post('/me/catalogue', auth, requireRole(['PROVIDER']), async (req, res) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) {
    return res.status(404).json({ message: 'Provider not found' });
  }

  const item = await prisma.catalogueItem.create({
    data: {
      providerId: provider.id,
      serviceId: req.body.serviceId,
      title: req.body.title,
      description: req.body.description,
      priceFrom: Number(req.body.priceFrom),
      priceTo: req.body.priceTo ? Number(req.body.priceTo) : null,
      priceUnit: req.body.priceUnit ?? 'job',
      estimatedHours: req.body.estimatedHours ? Number(req.body.estimatedHours) : null,
      status: CatalogueStatus.PENDING_REVIEW,
      isActive: false,
    },
  });

  return res.status(201).json(item);
});

router.put('/me/catalogue/:id', auth, requireRole(['PROVIDER']), async (req, res) => {
  const item = await prisma.catalogueItem.update({ where: { id: req.params.id }, data: req.body });
  return res.json(item);
});

router.delete('/me/catalogue/:id', auth, requireRole(['PROVIDER']), async (req, res) => {
  await prisma.catalogueItem.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});

router.post(
  '/me/catalogue/:id/images',
  auth,
  requireRole(['PROVIDER']),
  imageUploadRateLimiter,
  catalogueUpload.array('images', 10),
  validateAndProcessImages,
  async (req, res) => {
  const files = (req as any).processedImages as Array<{
    originalBuffer: Buffer;
    thumbnailBuffer: Buffer;
    widthPx: number;
    heightPx: number;
    fileSizeBytes: number;
  }>;

  const created = [];
  for (const file of files) {
    const url = await uploadBufferToS3(file.originalBuffer, 'image/jpeg', 'catalogue');
    const thumbnailUrl = await uploadBufferToS3(file.thumbnailBuffer, 'image/jpeg', 'catalogue/thumbnails');

    const image = await prisma.catalogueImage.create({
      data: {
        catalogueItemId: req.params.id,
        url,
        thumbnailUrl,
        widthPx: file.widthPx,
        heightPx: file.heightPx,
        fileSizeBytes: file.fileSizeBytes,
        reviewStatus: ImageReviewStatus.PENDING,
      },
    });

    created.push(image);
  }

  return res.status(201).json(created);
});

router.delete('/me/catalogue/:id/images/:imageId', auth, requireRole(['PROVIDER']), async (req, res) => {
  await prisma.catalogueImage.delete({ where: { id: req.params.imageId } });
  return res.json({ success: true });
});

export default router;
