import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@batsirai/config';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_S3_ENDPOINT,
  forcePathStyle: Boolean(env.AWS_S3_ENDPOINT),
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadBufferToS3(buffer: Buffer, contentType: string, prefix: string) {
  const key = `${prefix}/${uuidv4()}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  const base = env.AWS_S3_ENDPOINT
    ? `${env.AWS_S3_ENDPOINT}/${env.AWS_S3_BUCKET}`
    : `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;

  return `${base}/${key}`;
}
