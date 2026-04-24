import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return res.json(categories);
});

router.get('/categories/:slug', async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { services: true },
  });
  return res.json(category);
});

router.get('/categories/:slug/providers', async (req, res) => {
  const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const providers = await prisma.provider.findMany({
    where: {
      catalogueItems: {
        some: {
          service: {
            categoryId: category.id,
          },
        },
      },
    },
    include: { user: true },
  });

  return res.json(providers);
});

router.get('/services', async (_req, res) => {
  const services = await prisma.service.findMany({ where: { isActive: true } });
  return res.json(services);
});

router.get('/services/:id', async (req, res) => {
  const service = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  return res.json(service);
});

export default router;
