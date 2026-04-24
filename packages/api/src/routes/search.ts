import { Request, Response, Router } from 'express';
import { searchProviders } from '../services/searchService';

const router = Router();

function toOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

router.get('/', async (req: Request, res: Response) => {
  const lat = toOptionalNumber(req.query.lat);
  const lng = toOptionalNumber(req.query.lng);
  const radius = toOptionalNumber(req.query.radius);
  const minRating = toOptionalNumber(req.query.minRating);
  const maxPrice = toOptionalNumber(req.query.maxPrice);
  const page = toOptionalNumber(req.query.page);
  const limit = toOptionalNumber(req.query.limit);
  const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : undefined;

  if ((req.query.lat !== undefined || req.query.lng !== undefined) && (lat === undefined || lng === undefined)) {
    return res.status(400).json({ message: 'lat and lng must both be provided as valid numbers' });
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

  if (maxPrice !== undefined && maxPrice < 0) {
    return res.status(400).json({ message: 'maxPrice must be 0 or greater' });
  }

  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    return res.status(400).json({ message: 'page must be a positive integer' });
  }

  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 50)) {
    return res.status(400).json({ message: 'limit must be an integer between 1 and 50' });
  }

  const allowedSort = new Set(['distance_asc', 'distance_desc', 'rating_desc', 'rating_asc', 'newest']);
  if (sortBy && !allowedSort.has(sortBy)) {
    return res.status(400).json({ message: 'sortBy is invalid' });
  }

  if (q && q.length > 120) {
    return res.status(400).json({ message: 'q must be 120 characters or fewer' });
  }

  if (category && category.length > 80) {
    return res.status(400).json({ message: 'category must be 80 characters or fewer' });
  }

  try {
    const results = await searchProviders({
      q,
      category,
      lat,
      lng,
      radius,
      minRating,
      maxPrice,
      sortBy,
      page: page ? clamp(page, 1, 1000) : 1,
      limit: limit ? clamp(limit, 1, 50) : 20,
    });

    return res.json(results);
  } catch (error) {
    console.error('Search failed:', error);
    return res.status(500).json({ message: 'Search temporarily unavailable' });
  }
});

export default router;
