import sharp from 'sharp';
import { env } from '@batsirai/config';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

export async function validateAndProcessImage(file: Express.Multer.File) {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid image type. Allowed: jpeg, png, webp');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds 10MB');
  }

  const metadata = await sharp(file.buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width < env.MIN_IMAGE_WIDTH_PX || height < env.MIN_IMAGE_HEIGHT_PX) {
    throw new Error('Image must be at least 1080×1080px');
  }

  const thumbnail = await sharp(file.buffer)
    .resize(400, 400, { fit: 'cover' })
    .toFormat('webp')
    .toBuffer();

  return {
    width,
    height,
    fileSizeBytes: file.size,
    thumbnail,
  };
}
