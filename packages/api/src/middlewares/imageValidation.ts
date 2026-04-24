import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';

const MIN_WIDTH = parseInt(process.env.MIN_IMAGE_WIDTH_PX || '1080', 10);
const MIN_HEIGHT = parseInt(process.env.MIN_IMAGE_HEIGHT_PX || '1080', 10);
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ProcessedImage {
  originalname: string;
  mimetype: string;
  originalBuffer: Buffer;
  thumbnailBuffer: Buffer;
  widthPx: number;
  heightPx: number;
  fileSizeBytes: number;
}

export const catalogueUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

export async function validateAndProcessImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    res.status(400).json({ error: 'At least one image is required' });
    return;
  }

  const minRequired = parseInt(process.env.MIN_CATALOGUE_IMAGES || '3', 10);
  if (req.method === 'POST' && req.files.length < minRequired) {
    res.status(400).json({ error: `Minimum ${minRequired} images required per catalogue listing` });
    return;
  }

  try {
    const processedFiles: ProcessedImage[] = [];
    for (const file of req.files) {
      const metadata = await sharp(file.buffer).metadata();

      if (!metadata.width || !metadata.height) {
        res.status(400).json({ error: `Could not read image dimensions for ${file.originalname}` });
        return;
      }

      if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
        res.status(400).json({
          error: `Image \"${file.originalname}\" is ${metadata.width}x${metadata.height}px. Minimum required is ${MIN_WIDTH}x${MIN_HEIGHT}px.`,
          file: file.originalname,
          actual: { width: metadata.width, height: metadata.height },
          required: { width: MIN_WIDTH, height: MIN_HEIGHT },
        });
        return;
      }

      const thumbnailBuffer = await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toBuffer();

      const optimisedBuffer = await sharp(file.buffer)
        .resize(2160, 2160, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();

      processedFiles.push({
        originalname: file.originalname,
        mimetype: 'image/jpeg',
        originalBuffer: optimisedBuffer,
        thumbnailBuffer,
        widthPx: metadata.width,
        heightPx: metadata.height,
        fileSizeBytes: optimisedBuffer.length,
      });
    }

    (req as any).processedImages = processedFiles;
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Image processing failed' });
  }
}
