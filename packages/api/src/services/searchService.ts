import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function searchProviders(params: {
  q?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  minRating?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}) {
  const query = params.q?.trim();
  const category = params.category?.trim();
  const lat = params.lat ?? -15.4167;
  const lng = params.lng ?? 28.2833;
  const radius = params.radius ?? 50;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const offset = (page - 1) * limit;

  const whereConditions: Prisma.Sql[] = [
    Prisma.sql`p."isVerified" = true`,
    Prisma.sql`p."subscriptionStatus" = 'ACTIVE'`,
    Prisma.sql`p."subscriptionExpiresAt" > NOW()`,
    Prisma.sql`p."serviceAreaLat" IS NOT NULL`,
    Prisma.sql`p."serviceAreaLng" IS NOT NULL`,
    Prisma.sql`(6371 * acos(
      cos(radians(${lat})) * cos(radians(p."serviceAreaLat")) *
      cos(radians(p."serviceAreaLng") - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(p."serviceAreaLat"))
    )) <= ${radius}`,
  ];

  if (query) {
    whereConditions.push(
      Prisma.sql`(
        p."businessName" ILIKE ${`%${query}%`}
        OR p."bio" ILIKE ${`%${query}%`}
      )`,
    );
  }

  if (params.minRating !== undefined) {
    whereConditions.push(Prisma.sql`p."averageRating" >= ${params.minRating}`);
  }

  if (category) {
    whereConditions.push(
      Prisma.sql`EXISTS (
        SELECT 1
        FROM "CatalogueItem" ci
        JOIN "Service" s ON s.id = ci."serviceId"
        WHERE ci."providerId" = p.id
          AND ci."status" = 'APPROVED'
          AND ci."isActive" = true
          AND s."slug" = ${category}
      )`,
    );
  }

  if (params.maxPrice !== undefined) {
    whereConditions.push(
      Prisma.sql`EXISTS (
        SELECT 1
        FROM "CatalogueItem" ci
        WHERE ci."providerId" = p.id
          AND ci."status" = 'APPROVED'
          AND ci."isActive" = true
          AND ci."priceFrom" <= ${params.maxPrice}
      )`,
    );
  }

  const orderByClause = (() => {
    switch (params.sortBy) {
      case 'rating_desc':
        return Prisma.raw('p."averageRating" DESC, distance ASC');
      case 'rating_asc':
        return Prisma.raw('p."averageRating" ASC, distance ASC');
      case 'distance_desc':
        return Prisma.raw('distance DESC');
      case 'newest':
        return Prisma.raw('p."joinedAt" DESC, distance ASC');
      case 'distance_asc':
      default:
        return Prisma.raw('distance ASC');
    }
  })();

  const providers = await prisma.$queryRaw<
    Array<{
      id: string;
      businessName: string;
      bio: string | null;
      averageRating: number;
      distance: number;
    }>
  >(Prisma.sql`
    SELECT p.id,
           p."businessName",
           p."bio",
           p."averageRating",
           (6371 * acos(
             cos(radians(${lat})) * cos(radians(p."serviceAreaLat")) *
             cos(radians(p."serviceAreaLng") - radians(${lng})) +
             sin(radians(${lat})) * sin(radians(p."serviceAreaLat"))
           )) AS distance
    FROM "Provider" p
    WHERE ${Prisma.join(whereConditions, ' AND ')}
    ORDER BY ${orderByClause}
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return providers;
}
