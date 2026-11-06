import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { join } from 'path';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

export function ensureUploadsDir() {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function saveRaffleImage(file: Express.Multer.File) {
  const extension = MIME_EXT[file.mimetype];
  if (!extension) {
    throw new BadRequestException('Envie uma foto JPG, PNG ou WebP.');
  }

  ensureUploadsDir();
  const filename = `${randomUUID()}${extension}`;
  await writeFile(join(UPLOADS_DIR, filename), file.buffer);
  return `/api/uploads/${filename}`;
}

export async function removeUploadedFile(publicPath: string) {
  const filename = publicPath.split('/').pop();
  if (!filename || filename.includes('..')) {
    return;
  }
  await unlink(join(UPLOADS_DIR, filename)).catch(() => undefined);
}
